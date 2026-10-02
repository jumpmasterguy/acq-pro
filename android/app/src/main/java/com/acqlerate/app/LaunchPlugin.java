package com.acqlerate.app;

import android.app.Activity;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Lets the page say "my copy of the launch screen is on screen now", so the
 * native launch screen can step aside with nothing in between. Called from
 * index.html once its launch artwork has decoded and been painted.
 */
@CapacitorPlugin(name = "Launch")
public class LaunchPlugin extends Plugin {

    @PluginMethod
    public void ready(PluginCall call) {
        Activity activity = getActivity();
        if (activity instanceof MainActivity) {
            ((MainActivity) activity).markContentReady();
        }
        call.resolve();
    }
}
