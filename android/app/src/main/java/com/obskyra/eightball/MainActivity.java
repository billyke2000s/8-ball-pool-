package com.obskyra.eightball;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothServerSocket;
import android.bluetooth.BluetoothSocket;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

/**
 * Hosts the exact HTML5 pool UI used by the website, with a paired-device
 * Bluetooth Classic RFCOMM transport. Internet play stays in the WebSocket
 * web layer; Bluetooth does not provide internet multiplayer.
 */
public class MainActivity extends Activity {
    private static final UUID GAME_UUID =
        UUID.fromString("6e1b3c71-0d1d-45a1-965c-8c7ddba1f890");
    private static final int PERMISSION_BT = 1021;
    private final ExecutorService io = Executors.newCachedThreadPool();
    private final ExecutorService sendIo = Executors.newSingleThreadExecutor();
    private final Object writeLock = new Object();
    private WebView web;
    private BluetoothAdapter adapter;
    private BluetoothSocket socket;
    private BluetoothServerSocket serverSocket;
    private BufferedWriter writer;
    private Runnable pendingPermission;
    private volatile boolean closing;

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        // Keep Android system bars black like the supplied APK's portrait table.
        getWindow().setStatusBarColor(android.graphics.Color.BLACK);
        getWindow().setNavigationBarColor(android.graphics.Color.BLACK);
        BluetoothManager manager=(BluetoothManager)getSystemService(BLUETOOTH_SERVICE);
        adapter=manager==null?null:manager.getAdapter();
        web=new WebView(this);
        web.setBackgroundColor(0xff0b1113);
        WebSettings settings=web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(false);
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request){
                // Never expose the native bridge to web pages supplied by others.
                return !request.getUrl().toString().startsWith("file:///android_asset/");
            }
        });
        web.addJavascriptInterface(new Bridge(),"AndroidBridge");
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }

    private void js(String expression){
        runOnUiThread(()->{
            if(web!=null)web.evaluateJavascript(expression,null);
        });
    }
    private void status(String kind,String detail){
        js("window.poolBluetoothStatus("+JSONObject.quote(kind)+","+JSONObject.quote(detail)+");");
    }
    private void checkPermission(Runnable action){
        if(adapter==null){status("error","Bluetooth hardware not available");return;}
        Runnable validated=()->{
            if(!adapter.isEnabled()){status("error","Enable Bluetooth in Android Settings first");return;}
            action.run();
        };
        if(Build.VERSION.SDK_INT>=31 && checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT)!=PackageManager.PERMISSION_GRANTED){
            pendingPermission=validated;
            requestPermissions(new String[]{Manifest.permission.BLUETOOTH_CONNECT},PERMISSION_BT);
        }else validated.run();
    }
    @Override public void onRequestPermissionsResult(int requestCode,String[] permissions,int[] results){
        super.onRequestPermissionsResult(requestCode,permissions,results);
        if(requestCode==PERMISSION_BT){
            Runnable requested=pendingPermission;pendingPermission=null;
            if(results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED&&requested!=null)requested.run();
            else status("error","Bluetooth permission denied");
        }
    }

    @SuppressLint("MissingPermission")
    private void beginHosting(){
        disconnectInternal();
        closing=false;
        status("waiting","Waiting for another paired Android phone...");
        io.execute(()->{
            try{
                BluetoothServerSocket listener=adapter.listenUsingRfcommWithServiceRecord("8 Ball Pool",GAME_UUID);
                serverSocket=listener;
                BluetoothSocket accepted=listener.accept();
                listener.close();
                serverSocket=null;
                if(closing){accepted.close();return;}
                attach(accepted,"host");
            }catch(Exception e){
                if(!closing)status("error","Bluetooth host failed: "+e.getMessage());
            }
        });
    }

    @SuppressLint("MissingPermission")
    private void chooseDevice(){
        final Set<BluetoothDevice> bonded=adapter.getBondedDevices();
        if(bonded==null||bonded.isEmpty()){
            status("error","No paired devices. Pair the phones in Android Bluetooth Settings first.");
            return;
        }
        List<BluetoothDevice> devices=new ArrayList<>(bonded);
        devices.sort(Comparator.comparing(d->d.getName()==null?"":d.getName()));
        String[] labels=new String[devices.size()];
        for(int i=0;i<devices.size();i++){
            BluetoothDevice d=devices.get(i);
            labels[i]=(d.getName()==null?"Unnamed device":d.getName())+" ("+d.getAddress()+")";
        }
        new AlertDialog.Builder(this).setTitle("Join paired phone")
            .setItems(labels,(dialog,index)->connectDevice(devices.get(index)))
            .setNegativeButton("Cancel",(dialog,which)->status("disconnected","Cancelled"))
            .show();
    }

    @SuppressLint("MissingPermission")
    private void connectDevice(BluetoothDevice device){
        disconnectInternal();
        closing=false;
        status("waiting","Connecting to "+device.getName()+"...");
        io.execute(()->{
            try{
                BluetoothSocket client=device.createRfcommSocketToServiceRecord(GAME_UUID);
                socket=client;
                client.connect();
                if(closing){client.close();return;}
                attach(client,"guest");
            }catch(Exception e){
                if(!closing)status("error","Bluetooth connect failed: "+e.getMessage());
            }
        });
    }

    private void attach(BluetoothSocket connected,String role) throws IOException {
        socket=connected;
        BufferedReader reader=new BufferedReader(new InputStreamReader(connected.getInputStream(),StandardCharsets.UTF_8));
        synchronized(writeLock){
            writer=new BufferedWriter(new OutputStreamWriter(connected.getOutputStream(),StandardCharsets.UTF_8));
        }
        status(role,"Connected");
        try{
            String line;
            while(!closing&&(line=reader.readLine())!=null){
                if(line.length()>16384)continue;
                // Quote JSON strings safely before they reach evaluateJavascript.
                js("window.poolBluetoothReceive("+JSONObject.quote(line)+");");
            }
        }finally{
            disconnectInternal();
            status("disconnected","Bluetooth peer left");
        }
    }

    private void disconnectInternal(){
        closing=true;
        synchronized(writeLock){writer=null;}
        try{if(serverSocket!=null)serverSocket.close();}catch(IOException ignored){}
        try{if(socket!=null)socket.close();}catch(IOException ignored){}
        serverSocket=null;socket=null;
    }
    private final class Bridge {
        @JavascriptInterface public void host(){runOnUiThread(()->checkPermission(()->beginHosting()));}
        @JavascriptInterface public void join(){runOnUiThread(()->checkPermission(()->chooseDevice()));}
        @JavascriptInterface public void disconnect(){
            runOnUiThread(()->{disconnectInternal();status("disconnected","Closed");});
        }
        @JavascriptInterface public void send(String message){
            if(message==null||message.length()>16000)return;
            sendIo.execute(()->{
                synchronized(writeLock){
                    if(writer==null)return;
                    try{writer.write(message);writer.newLine();writer.flush();}
                    catch(IOException e){status("error","Bluetooth send failed");}
                }
            });
        }
    }
    @Override public void onDestroy(){
        disconnectInternal();
        io.shutdownNow();
        sendIo.shutdownNow();
        if(web!=null){web.removeJavascriptInterface("AndroidBridge");web.destroy();web=null;}
        super.onDestroy();
    }
}
