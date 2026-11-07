package com.cue.microfluidic;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;

public final class MainActivity extends Activity {
    private static final String ASSET_HOST = "appassets.androidplatform.net";
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(0xFF07131F);
        getWindow().setNavigationBarColor(0xFF07131F);

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);

        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.setBackgroundColor(0xFF07131F);
        webView.addJavascriptInterface(new LocalExportBridge(), "AndroidBridge");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!"https".equals(uri.getScheme()) || !ASSET_HOST.equals(uri.getHost())) {
                    return response(403, "Forbidden", "text/plain", "Blocked: offline app only");
                }
                String assetPath = uri.getPath();
                if (assetPath == null || !assetPath.startsWith("/web/") || assetPath.contains("..")) {
                    return response(404, "Not Found", "text/plain", "Not found");
                }
                String assetName = assetPath.substring(1);
                try {
                    InputStream stream = getAssets().open(assetName);
                    String extension = MimeTypeMap.getFileExtensionFromUrl(assetName);
                    String mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
                    if (mimeType == null) {
                        if (assetName.endsWith(".js")) mimeType = "text/javascript";
                        else mimeType = "application/octet-stream";
                    }
                    return new WebResourceResponse(mimeType, "UTF-8", stream);
                } catch (IOException exception) {
                    return response(404, "Not Found", "text/plain", "Not found");
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                return !"https".equals(uri.getScheme()) || !ASSET_HOST.equals(uri.getHost());
            }
        });
        setContentView(webView);
        webView.loadUrl("https://" + ASSET_HOST + "/web/index.html");
    }

    private WebResourceResponse response(int code, String reason, String mime, String body) {
        return new WebResourceResponse(
            mime,
            "UTF-8",
            code,
            reason,
            Collections.singletonMap("Cache-Control", "no-store"),
            new ByteArrayInputStream(body.getBytes(java.nio.charset.StandardCharsets.UTF_8))
        );
    }

    public final class LocalExportBridge {
        @JavascriptInterface
        public void shareRunLog(String json) {
            if (json == null || json.length() > 1_000_000) return;
            runOnUiThread(() -> {
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("application/json");
                send.putExtra(Intent.EXTRA_SUBJECT, "Microfluidic simulator run log");
                send.putExtra(Intent.EXTRA_TEXT, json);
                startActivity(Intent.createChooser(send, "Save or share run log"));
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
