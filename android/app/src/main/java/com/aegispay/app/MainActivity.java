package com.aegispay.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

import com.journeyapps.barcodescanner.CaptureActivity;
import com.google.zxing.integration.android.IntentIntegrator;
import com.google.zxing.integration.android.IntentResult;

public class MainActivity extends AppCompatActivity {
    private static final int LOCATION_REQUEST = 701;
    private WebView webView;
    private String pendingAuthRedirect;
    private boolean webReady;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        configureWebView(webView);
        webView.addJavascriptInterface(new AegisBridge(), "AegisNative");
        webView.loadUrl("https://appassets.androidplatform.net/assets/aegispay/index.html");
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
            public void onPageFinished(WebView v, String url) {
                super.onPageFinished(v, url);
                webReady = true;
                dispatchPendingAuthRedirect();
            }
        });
        view.setWebChromeClient(new WebChromeClient());
    }

    private void handleIncomingIntent(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data == null) return;
        if (!"com.aegispay.app".equalsIgnoreCase(data.getScheme())) return;
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
        public void showMessage(String message) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, message == null ? "" : message, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface
        public String runtimeInfo() {
            return "{\"framework\":\"UniApp-compatible hybrid\",\"appId\":\"__UNI__D835ED9\",\"hmsCore\":\"6.5.0.300PK\",\"androidX\":true,\"webView\":true}";
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
