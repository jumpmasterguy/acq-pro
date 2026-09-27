package com.acqlerate.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Choreographer;
import android.webkit.WebView;

import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

/**
 * Launch screen handover, in two steps.
 *
 * 1. HOLD. The launch screen stays up until the page is ready: it has loaded
 *    and its own copy of the launch screen (index.html #boot-splash) has its
 *    artwork decoded. The page says so through LaunchPlugin.
 *
 * 2. SWAP. While the launch screen is held, Android does not draw the app at
 *    all, so the page underneath cannot be pre-painted. Removing the launch
 *    screen the moment the hold ends therefore always showed a blank frame
 *    while the WebView drew for the first time: the "logo, blink, logo" at
 *    start-up. So once the hold ends the launch screen is kept as an overlay
 *    while the app draws underneath it, and removed only after the WebView
 *    reports (postVisualStateCallback) that the page's frame is going on
 *    screen. The two pictures are identical, so the swap is invisible.
 *
 * Every wait has a ceiling, so nothing here can trap anyone on the icon.
 */
public class MainActivity extends BridgeActivity {

    private volatile boolean contentReady = false;

    /** Page loaded but never signalled (e.g. an older deploy): let go anyway. */
    private static final long AFTER_LOAD_FALLBACK_MS = 1500;
    /** Upper bound on the hold, for a dead connection. */
    private static final long MAX_SPLASH_MS = 6000;
    /** Upper bound on waiting for the WebView's first frame during the swap. */
    private static final long MAX_SWAP_MS = 800;

    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Must run before super.onCreate — it swaps the launch theme out.
        SplashScreen splash = SplashScreen.installSplashScreen(this);
        // Local plugins are registered before the bridge is built.
        registerPlugin(LaunchPlugin.class);
        super.onCreate(savedInstanceState);

        // Step 1: hold.
        splash.setKeepOnScreenCondition(() -> !contentReady);

        // Step 2: swap only once the page is actually drawn underneath.
        splash.setOnExitAnimationListener(provider -> {
            final boolean[] removed = { false };
            final Runnable remove = () -> {
                if (removed[0]) return;
                removed[0] = true;
                provider.remove();
            };
            handler.postDelayed(remove, MAX_SWAP_MS);

            WebView webView = bridge != null ? bridge.getWebView() : null;
            if (webView == null) {
                remove.run();
                return;
            }
            webView.postVisualStateCallback(1, new WebView.VisualStateCallback() {
                @Override
                public void onComplete(long requestId) {
                    // The page is in the frame being produced now; take the
                    // launch screen away on the frame after it.
                    Choreographer.getInstance().postFrameCallback(frameTimeNanos -> remove.run());
                }
            });
        });

        if (bridge == null) {
            // No WebView available (Capacitor shows its own error screen).
            contentReady = true;
            return;
        }

        bridge.addWebViewListener(new WebViewListener() {
            @Override
            public void onPageLoaded(WebView webView) {
                handler.postDelayed(MainActivity.this::markContentReady, AFTER_LOAD_FALLBACK_MS);
            }

            @Override
            public void onReceivedError(WebView webView) {
                // Let the page show its own offline state instead of the icon.
                markContentReady();
            }
        });

        handler.postDelayed(this::markContentReady, MAX_SPLASH_MS);
    }

    /** Called by LaunchPlugin.ready() and by the fallbacks above. */
    public void markContentReady() {
        contentReady = true;
    }
}
