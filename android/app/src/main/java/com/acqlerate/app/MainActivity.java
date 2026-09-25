package com.acqlerate.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;

import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {

    /**
     * The launch screen stays up until the site has loaded, so the first thing
     * after the icon is the app itself rather than a blank or half-drawn page.
     * Readiness, not a timer: a warm start on wifi lets go almost at once, a
     * cold start on a weak signal holds the icon as long as it needs to.
     */
    private volatile boolean contentReady = false;

    /** Upper bound, so a dead connection never traps someone on the icon. */
    private static final long MAX_SPLASH_MS = 6000;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Must run before super.onCreate — it swaps the launch theme out.
        SplashScreen splash = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        splash.setKeepOnScreenCondition(() -> !contentReady);

        if (bridge == null) {
            // No WebView available (Capacitor shows its own error screen).
            contentReady = true;
            return;
        }

        bridge.addWebViewListener(new WebViewListener() {
            @Override
            public void onPageLoaded(WebView webView) {
                contentReady = true;
            }

            @Override
            public void onReceivedError(WebView webView) {
                // Let the page show its own offline state instead of the icon.
                contentReady = true;
            }
        });

        new Handler(Looper.getMainLooper()).postDelayed(() -> contentReady = true, MAX_SPLASH_MS);
    }
}
