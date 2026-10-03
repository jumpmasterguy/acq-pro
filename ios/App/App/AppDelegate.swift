import UIKit
import Capacitor
import StoreKit
import AVFoundation

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // The Debrief is long-form audio. With the "audio" background mode in
        // Info.plist and a playback session, it keeps playing with the screen
        // locked or the app in the background, and ignores the silent switch,
        // like any podcast app. Without this iOS stops it the moment the
        // screen locks.
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio)
        } catch {
            print("[audio] could not set playback session: \(error)")
        }
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

// MARK: - Launch screen handover
//
// iOS dismisses the launch storyboard as soon as the app is up, which is
// before the page has painted, so without this there is a bare teal frame
// between the launch image and the page's own copy of it (index.html
// #boot-splash). MainViewController lays the same launch image over the
// web view and keeps it there until the page calls Launch.ready(), i.e.
// once its identical copy is on screen. Then the cover steps aside and the
// handover is invisible. Six seconds at most, so a dead connection never
// traps anyone on the image.
//
// These live here, in a file the Xcode target already compiles, rather than
// in new files that would need adding to the project by hand.

class MainViewController: CAPBridgeViewController {
    private var launchCover: UIImageView?

    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(LaunchPlugin())
        bridge?.registerPluginInstance(StorePlugin())
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        let cover = UIImageView(image: UIImage(named: "Splash"))
        cover.contentMode = .scaleAspectFill   // same fit as LaunchScreen.storyboard
        cover.frame = view.bounds
        cover.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        cover.backgroundColor = UIColor(red: 1 / 255, green: 105 / 255, blue: 111 / 255, alpha: 1)
        view.addSubview(cover)
        launchCover = cover
        DispatchQueue.main.asyncAfter(deadline: .now() + 6) { [weak self] in
            self?.hideLaunchCover()
        }
    }

    func hideLaunchCover() {
        guard let cover = launchCover else { return }
        launchCover = nil
        cover.removeFromSuperview()
    }
}

@objc(LaunchPlugin)
public class LaunchPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LaunchPlugin"
    public let jsName = "Launch"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "ready", returnType: CAPPluginReturnPromise)
    ]

    @objc func ready(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            (self?.bridge?.viewController as? MainViewController)?.hideLaunchCover()
        }
        call.resolve()
    }
}

// MARK: - App Store storefront
//
// Which App Store country this phone is signed into. Decides whether the app
// may show Pro checkout (client/src/lib/appCheckout.ts): Apple allows linking
// out to our own checkout on the US storefront only. This is the store
// account's country, which is what Apple's rules key on, not the phone's
// location or language.

@objc(StorePlugin)
public class StorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StorePlugin"
    public let jsName = "Store"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "storefront", returnType: CAPPluginReturnPromise)
    ]

    @objc func storefront(_ call: CAPPluginCall) {
        Task {
            // ISO 3166-1 alpha-3, e.g. "USA". Empty if StoreKit can't say.
            let code = await Storefront.current?.countryCode ?? ""
            call.resolve(["countryCode": code])
        }
    }
}
