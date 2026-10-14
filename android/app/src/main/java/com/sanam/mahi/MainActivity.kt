package com.sanam.mahi

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var errorLayout: View
    private lateinit var btnRetry: Button
    private lateinit var btnConfigServer: Button

    private lateinit var webAppInterface: WebAppInterface
    private var pendingPermissionRequest: PermissionRequest? = null
    private var backPressedTime: Long = 0

    companion object {
        private const val PERMISSION_REQUEST_CODE = 1001
        private const val PREFS_NAME = "JarvisMahiPrefs"
        private const val KEY_SERVER_URL = "server_url"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        setupBackNavigation()
        setupWebView()
        loadApp()
    }

    private fun initViews() {
        webView = findViewById(R.id.webView)
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)
        progressBar = findViewById(R.id.progressBar)
        errorLayout = findViewById(R.id.errorLayout)
        btnRetry = findViewById(R.id.btnRetry)
        btnConfigServer = findViewById(R.id.btnConfigServer)

        swipeRefreshLayout.setColorSchemeResources(R.color.cyan_primary, R.color.pink_accent)
        swipeRefreshLayout.setOnRefreshListener {
            webView.reload()
        }

        btnRetry.setOnClickListener {
            errorLayout.visibility = View.GONE
            loadApp()
        }

        btnConfigServer.setOnClickListener {
            showServerConfigDialog()
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    if (backPressedTime + 2000 > System.currentTimeMillis()) {
                        finish()
                    } else {
                        Toast.makeText(this@MainActivity, "Press back again to exit JARVIS", Toast.LENGTH_SHORT).show()
                        backPressedTime = System.currentTimeMillis()
                    }
                }
            }
        })
    }

    fun requestMicPermissionDirectly() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            == PackageManager.PERMISSION_GRANTED
        ) {
            Toast.makeText(this, "Microphone permission is already granted!", Toast.LENGTH_SHORT).show()
            notifyWebPermissionChanged(true)
            return
        }

        if (ActivityCompat.shouldShowRequestPermissionRationale(this, Manifest.permission.RECORD_AUDIO)) {
            showPermissionRationaleDialog()
        } else {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.RECORD_AUDIO),
                PERMISSION_REQUEST_CODE
            )
        }
    }

    private fun showPermissionRationaleDialog() {
        AlertDialog.Builder(this)
            .setTitle("Microphone Permission Required")
            .setMessage(getString(R.string.mic_permission_rationale))
            .setPositiveButton("Grant Permission") { _, _ ->
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.RECORD_AUDIO),
                    PERMISSION_REQUEST_CODE
                )
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showPermissionPermanentlyDeniedDialog() {
        AlertDialog.Builder(this)
            .setTitle("Microphone Access Blocked")
            .setMessage("Microphone permission has been permanently denied. To enable voice conversations with JARVIS • MAHI, please turn on Microphone permission in Android App Settings.")
            .setPositiveButton("Open App Settings") { _, _ ->
                webAppInterface.openAppSettings()
            }
            .setNegativeButton("Use Text Chat", null)
            .show()
    }

    private fun notifyWebPermissionChanged(granted: Boolean) {
        val js = "window.dispatchEvent(new CustomEvent('micPermissionChanged', { detail: { granted: $granted } }));"
        webView.evaluateJavascript(js, null)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings

        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.displayZoomControls = false
        settings.builtInZoomControls = false
        settings.setSupportZoom(false)

        // Security: Disallow unrestricted local file access
        settings.allowFileAccess = false
        settings.allowContentAccess = false

        settings.cacheMode = if (NetworkUtils.isNetworkAvailable(this)) {
            WebSettings.LOAD_DEFAULT
        } else {
            WebSettings.LOAD_CACHE_ELSE_NETWORK
        }

        // Bridge to JavaScript
        webAppInterface = WebAppInterface(this)
        webView.addJavascriptInterface(webAppInterface, "AndroidBridge")

        // WebChromeClient handling permissions and progress
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress < 100) {
                    progressBar.visibility = View.VISIBLE
                    progressBar.progress = newProgress
                } else {
                    progressBar.visibility = View.GONE
                    swipeRefreshLayout.isRefreshing = false
                }
            }

            override fun onPermissionRequest(request: PermissionRequest?) {
                if (request == null) return

                val origin = request.origin
                val originHost = origin?.host
                val serverHost = Uri.parse(getServerUrl()).host

                // 1. Verify Origin: Only allow trusted app domain or localhost
                val isTrustedOrigin = originHost != null && (
                    originHost == serverHost ||
                    originHost == "localhost" ||
                    originHost == "127.0.0.1" ||
                    originHost.endsWith(".run.app")
                )

                if (!isTrustedOrigin) {
                    request.deny()
                    return
                }

                // 2. Only grant audio capture
                val requestedResources = request.resources
                val hasAudioCapture = requestedResources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)

                if (!hasAudioCapture) {
                    request.deny()
                    return
                }

                // 3. Check Android RECORD_AUDIO permission
                runOnUiThread {
                    if (ContextCompat.checkSelfPermission(
                            this@MainActivity,
                            Manifest.permission.RECORD_AUDIO
                        ) == PackageManager.PERMISSION_GRANTED
                    ) {
                        request.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                    } else {
                        pendingPermissionRequest = request
                        if (ActivityCompat.shouldShowRequestPermissionRationale(this@MainActivity, Manifest.permission.RECORD_AUDIO)) {
                            showPermissionRationaleDialog()
                        } else {
                            ActivityCompat.requestPermissions(
                                this@MainActivity,
                                arrayOf(Manifest.permission.RECORD_AUDIO),
                                PERMISSION_REQUEST_CODE
                            )
                        }
                    }
                }
            }
        }

        // WebViewClient handling navigation and network errors
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                errorLayout.visibility = View.GONE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                swipeRefreshLayout.isRefreshing = false
                progressBar.visibility = View.GONE
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    swipeRefreshLayout.isRefreshing = false
                    progressBar.visibility = View.GONE
                    errorLayout.visibility = View.VISIBLE
                }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val currentServerHost = Uri.parse(getServerUrl()).host
                val requestHost = request?.url?.host

                // Allow internal app navigation
                if (requestHost != null && (requestHost == currentServerHost || requestHost == "localhost")) {
                    return false
                }

                // Route external URLs to native applications (YouTube, TikTok, browser)
                return try {
                    val intent = Intent(Intent.ACTION_VIEW, request?.url)
                    startActivity(intent)
                    true
                } catch (e: Exception) {
                    false
                }
            }
        }
    }

    private fun getServerUrl(): String {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_SERVER_URL, getString(R.string.default_server_url))
            ?: getString(R.string.default_server_url)
    }

    private fun setServerUrl(url: String) {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_SERVER_URL, url).apply()
    }

    private fun loadApp() {
        if (!NetworkUtils.isNetworkAvailable(this)) {
            errorLayout.visibility = View.VISIBLE
            return
        }

        val url = getServerUrl()
        webView.loadUrl(url)
    }

    private fun showServerConfigDialog() {
        val currentUrl = getServerUrl()
        val input = EditText(this)
        input.setText(currentUrl)

        AlertDialog.Builder(this)
            .setTitle("Server URL Configuration")
            .setMessage("Configure endpoint for JARVIS • MAHI AI:")
            .setView(input)
            .setPositiveButton("Save & Reload") { _, _ ->
                val newUrl = input.text.toString().trim()
                if (newUrl.isNotBlank()) {
                    setServerUrl(newUrl)
                    errorLayout.visibility = View.GONE
                    loadApp()
                }
            }
            .setNeutralButton("Reset Default") { _, _ ->
                setServerUrl(getString(R.string.default_server_url))
                errorLayout.visibility = View.GONE
                loadApp()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            val audioIndex = permissions.indexOf(Manifest.permission.RECORD_AUDIO)
            val isGranted = audioIndex != -1 && grantResults.getOrNull(audioIndex) == PackageManager.PERMISSION_GRANTED

            runOnUiThread {
                if (isGranted) {
                    pendingPermissionRequest?.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                    notifyWebPermissionChanged(true)
                    Toast.makeText(this, "Microphone permission granted!", Toast.LENGTH_SHORT).show()
                } else {
                    pendingPermissionRequest?.deny()
                    notifyWebPermissionChanged(false)
                    if (!ActivityCompat.shouldShowRequestPermissionRationale(this, Manifest.permission.RECORD_AUDIO)) {
                        showPermissionPermanentlyDeniedDialog()
                    } else {
                        Toast.makeText(this, getString(R.string.mic_permission_denied), Toast.LENGTH_LONG).show()
                    }
                }
                pendingPermissionRequest = null
            }
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
        webAppInterface.stopNativeSpeech()
    }

    override fun onDestroy() {
        webAppInterface.shutdown()
        webView.destroy()
        super.onDestroy()
    }
}
