package com.aegispay.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.Intent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.net.Uri;
import android.content.pm.PackageInfo;
import android.os.Bundle;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

import com.journeyapps.barcodescanner.CaptureActivity;

import java.io.InputStream;
import java.security.MessageDigest;
import java.util.Locale;
import com.google.zxing.integration.android.IntentIntegrator;
import com.google.zxing.integration.android.IntentResult;

public class MainActivity extends AppCompatActivity {
    private static final int LOCATION_REQUEST = 701;
    private WebView webView;
    private ValueCallback<Uri[]> pendingFileSelection;
    private String pendingAuthRedirect;
    private boolean webReady;
    private boolean localFallbackLoaded;
    private long activeUpdateDownloadId = -1L;
    private String activeUpdateSha256 = "";
    private Uri pendingInstallUri;
    private BroadcastReceiver updateDownloadReceiver;
    private static final int UNKNOWN_SOURCE_REQUEST = 9842;
    private static final String REMOTE_APP_BASE = "https://aegispay-pro.netlify.app/";
    private static final String UPDATE_HOST = "aegispay-pro.netlify.app";
    private ActivityResultLauncher<Intent> imagePickerLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        imagePickerLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (pendingFileSelection == null) return;
                    Uri[] selected = result.getResultCode() == RESULT_OK
                            ? WebChromeClient.FileChooserParams.parseResult(result.getResultCode(), result.getData())
                            : null;
                    pendingFileSelection.onReceiveValue(selected);
                    pendingFileSelection = null;
                }
        );
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        configureWebView(webView);
        webView.addJavascriptInterface(new AegisBridge(), "AegisNative");
        loadPortal();
        handleIncomingIntent(getIntent());
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView(WebView view) {
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setLoadWithOverviewMode(false);
        settings.setUseWideViewPort(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportMultipleWindows(false);

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        view.setWebViewClient(new WebViewClientCompat() {
            @Override
            public android.webkit.WebResourceResponse shouldInterceptRequest(WebView v, String url) {
                return assetLoader.shouldInterceptRequest(Uri.parse(url));
            }

            @Override
            public void onReceivedError(WebView v, int errorCode, String description, String failingUrl) {
                if (!localFallbackLoaded && failingUrl != null && failingUrl.startsWith(REMOTE_APP_BASE)) {
                    loadLocalPortal();
                }
            }

            @Override
            public void onReceivedHttpError(WebView v, android.webkit.WebResourceRequest request, android.webkit.WebResourceResponse errorResponse) {
                if (request != null && request.isForMainFrame() && !localFallbackLoaded && request.getUrl().toString().startsWith(REMOTE_APP_BASE)) {
                    loadLocalPortal();
                }
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                super.onPageFinished(v, url);
                webReady = true;
                dispatchPendingAuthRedirect();
            }
        });
        view.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pendingFileSelection != null) pendingFileSelection.onReceiveValue(null);
                pendingFileSelection = callback;
                Intent picker = params.createIntent();
                picker.setType("image/*");
                picker.addCategory(Intent.CATEGORY_OPENABLE);
                picker.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"image/jpeg", "image/png", "image/webp"});
                try {
                    imagePickerLauncher.launch(Intent.createChooser(picker, "Choose image"));
                    return true;
                } catch (Exception ignored) {
                    pendingFileSelection = null;
                    callback.onReceiveValue(null);
                    return false;
                }
            }
        });
    }


    private void loadPortal() {
        localFallbackLoaded = false;
        webReady = false;
        loadLocalPortal();
    }

    private void loadLocalPortal() {
        if (webView == null || localFallbackLoaded) return;
        localFallbackLoaded = true;
        webReady = false;
        webView.loadUrl("https://appassets.androidplatform.net/assets/aegispay/" + getString(R.string.entry_html));
    }

    private String sha256(Uri uri) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            if (in == null) throw new IllegalStateException("Unable to read downloaded update.");
            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) digest.update(buffer, 0, read);
        }
        StringBuilder result = new StringBuilder(64);
        for (byte value : digest.digest()) result.append(String.format(Locale.US, "%02x", value));
        return result.toString();
    }

    private void startApkDownload(String url, String versionName, String expectedSha256) {
        if (url == null || !url.startsWith("https://") || !UPDATE_HOST.equals(Uri.parse(url).getHost())) {
            Toast.makeText(this, "Invalid AegisPay update source.", Toast.LENGTH_LONG).show();
            return;
        }
        if (activeUpdateDownloadId != -1L) {
            Toast.makeText(this, "Update download is already running.", Toast.LENGTH_SHORT).show();
            return;
        }

        DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
        String flavor = getString(R.string.entry_html).contains("master-admin") ? "admin" : "client";
        String safeVersion = String.valueOf(versionName == null ? "latest" : versionName).replaceAll("[^A-Za-z0-9._-]", "_");
        String fileName = "aegispay-" + flavor + "-" + safeVersion + ".apk";

        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
        request.setTitle("AegisPay " + safeVersion);
        request.setDescription("Downloading secure application update");
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setMimeType("application/vnd.android.package-archive");
        request.setAllowedOverMetered(true);
        request.setAllowedOverRoaming(false);
        request.setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, fileName);

        registerUpdateReceiver();
        activeUpdateSha256 = expectedSha256 == null ? "" : expectedSha256.trim().toLowerCase(Locale.US);
        activeUpdateDownloadId = manager.enqueue(request);
        Toast.makeText(this, "AegisPay update download started.", Toast.LENGTH_SHORT).show();
    }

    private void registerUpdateReceiver() {
        if (updateDownloadReceiver != null) return;
        updateDownloadReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L);
                if (id == activeUpdateDownloadId) handleUpdateDownloaded(id);
            }
        };
        ContextCompat.registerReceiver(
                this,
                updateDownloadReceiver,
                new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                ContextCompat.RECEIVER_NOT_EXPORTED
        );
    }

    private void handleUpdateDownloaded(long id) {
        DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
        DownloadManager.Query query = new DownloadManager.Query().setFilterById(id);
        android.database.Cursor cursor = manager.query(query);
        boolean success = false;
        try {
            if (cursor != null && cursor.moveToFirst()) {
                int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                success = status == DownloadManager.STATUS_SUCCESSFUL;
            }
        } finally {
            if (cursor != null) cursor.close();
        }

        Uri apkUri = success ? manager.getUriForDownloadedFile(id) : null;
        activeUpdateDownloadId = -1L;

        if (updateDownloadReceiver != null) {
            try { unregisterReceiver(updateDownloadReceiver); } catch (Exception ignored) { }
            updateDownloadReceiver = null;
        }

        if (!success || apkUri == null) {
            Toast.makeText(this, "AegisPay update download failed.", Toast.LENGTH_LONG).show();
            return;
        }

        try {
            if (!activeUpdateSha256.isEmpty() && !activeUpdateSha256.equalsIgnoreCase(sha256(apkUri))) {
                Toast.makeText(this, "Update verification failed. The APK was not installed.", Toast.LENGTH_LONG).show();
                return;
            }
        } catch (Exception error) {
            Toast.makeText(this, "Update verification could not be completed.", Toast.LENGTH_LONG).show();
            return;
        }

        pendingInstallUri = apkUri;
        installDownloadedApk();
    }

    private void installDownloadedApk() {
        if (pendingInstallUri == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                !getPackageManager().canRequestPackageInstalls()) {
            Intent settingsIntent = new Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getPackageName())
            );
            startActivityForResult(settingsIntent, UNKNOWN_SOURCE_REQUEST);
            Toast.makeText(this, "Allow AegisPay to install updates, then return here.", Toast.LENGTH_LONG).show();
            return;
        }

        Intent installIntent = new Intent(Intent.ACTION_VIEW);
        installIntent.setDataAndType(pendingInstallUri, "application/vnd.android.package-archive");
        installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            startActivity(installIntent);
        } catch (Exception error) {
            Toast.makeText(this, "Android could not open the update installer.", Toast.LENGTH_LONG).show();
        }
    }

    private void handleIncomingIntent(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data == null) return;
        if (!getString(R.string.auth_scheme).equalsIgnoreCase(data.getScheme())) return;
        pendingAuthRedirect = data.toString();
        dispatchPendingAuthRedirect();
    }

    private void dispatchPendingAuthRedirect() {
        if (!webReady || webView == null || pendingAuthRedirect == null) return;
        String redirect = pendingAuthRedirect;
        pendingAuthRedirect = null;
        String quoted = JSONObjectEscape.quote(redirect);
        callJs("(window.AegisAuthRedirect && window.AegisAuthRedirect.handle) ? window.AegisAuthRedirect.handle(" + quoted + ").catch(function(e){ try { if (window.AegisNative) window.AegisNative.showMessage(e.message || 'Authentication callback failed'); } catch (_) {} }) : null");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingIntent(intent);
    }

    private void callJs(String expression) {
        runOnUiThread(() -> {
            if (webView != null) webView.evaluateJavascript(expression, null);
        });
    }

    private void startScan() {
        IntentIntegrator integrator = new IntentIntegrator(this);
        integrator.setCaptureActivity(CaptureActivity.class);
        integrator.setDesiredBarcodeFormats(IntentIntegrator.ALL_CODE_TYPES);
        integrator.setPrompt("Scan QR / barcode");
        integrator.setBeepEnabled(true);
        integrator.setOrientationLocked(false);
        integrator.initiateScan();
    }

    private void requestLocation() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                    this,
                    new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION},
                    LOCATION_REQUEST
            );
            return;
        }
        readLastKnownLocation();
    }

    @SuppressLint("MissingPermission")
    private void readLastKnownLocation() {
        LocationManager lm = (LocationManager) getSystemService(LOCATION_SERVICE);
        Location best = null;
        try {
            if (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                best = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            }
            if (best == null && lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                best = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            }
        } catch (Exception ignored) { }

        if (best == null) {
            Toast.makeText(this, "Location not available. Enable location services.", Toast.LENGTH_LONG).show();
            return;
        }

        String json = "{\"latitude\":" + best.getLatitude() + ",\"longitude\":" + best.getLongitude() + "}";
        callJs("window.AegisNativeLocation && window.AegisNativeLocation(" + JSONObjectEscape.quote(json) + ")");
    }

    private void openLocation(String query) {
        String q = query == null ? "" : query.trim();
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(q.isEmpty() ? "geo:0,0?q=AegisPay" : "geo:0,0?q=" + Uri.encode(q)));
        try {
            startActivity(intent);
        } catch (Exception ex) {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/search/?api=1&query=" + Uri.encode(q))));
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == LOCATION_REQUEST && grantResults.length > 0
                && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            readLastKnownLocation();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == UNKNOWN_SOURCE_REQUEST) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || getPackageManager().canRequestPackageInstalls()) {
                installDownloadedApk();
            } else {
                Toast.makeText(this, "Update installation was not authorized.", Toast.LENGTH_LONG).show();
            }
        }

        IntentResult result = IntentIntegrator.parseActivityResult(requestCode, resultCode, data);
        if (result != null) {
            if (result.getContents() != null) {
                String value = result.getContents().replace("\\", "\\\\").replace("'", "\\'");
                callJs("window.AegisNativeScanResult && window.AegisNativeScanResult('" + value + "')");
            } else {
                callJs("window.AegisNativeScanResult && window.AegisNativeScanResult('')");
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    public final class AegisBridge {
        @JavascriptInterface
        public void chooseLocation() {
            requestLocation();
        }

        @JavascriptInterface
        public void openLocation(String query) {
            openLocation(query);
        }

        @JavascriptInterface
        public void scan() {
            runOnUiThread(MainActivity.this::startScan);
        }

        @JavascriptInterface
        public int appVersionCode() {
            try {
                PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
                return info.versionCode;
            } catch (Exception ignored) { return 0; }
        }

        @JavascriptInterface
        public String appVersionName() {
            try {
                PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
                return info.versionName == null ? "" : info.versionName;
            } catch (Exception ignored) { return ""; }
        }

        @JavascriptInterface
        public void startApkUpdate(String url, String versionName, String sha256) {
            runOnUiThread(() -> startApkDownload(url, versionName, sha256));
        }

        @JavascriptInterface
        public void showMessage(String message) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, message == null ? "" : message, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface
        public String runtimeInfo() {
            return "{\"framework\":\"WebView\",\"apiMode\":\"Supabase\",\"androidX\":true,\"webView\":true}";
        }

        @JavascriptInterface
        public void openAppSettings() {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + getPackageName()));
            startActivity(intent);
        }
    }

    static final class JSONObjectEscape {
        static String quote(String value) {
            if (value == null) return "\"\"";
            return "\"" + value.replace("\\\\", "\\\\\\\\").replace("\"", "\\\\\"") + "\"";
        }
    }
}
