# Doğuş Otomat Telemetri Sistemi - Deployment Guide

This guide explains how to properly deploy and configure the Doğuş Otomat Telemetri Sistemi for production use.

## Prerequisites

1. Node.js v18 or higher
2. Firebase account with Realtime Database
3. Netlify account for hosting
4. Firebase Admin SDK service account key

## Environment Configuration

### 1. Firebase Configuration

Create a `.env` file in the root directory with your Firebase configuration:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Firebase Admin SDK (for Netlify Functions)

For Netlify functions to access Firebase:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. Save the JSON file as `firebase-adminsdk.json` in the project root (add to .gitignore)

## Building the Application

### Development Build
```bash
npm start
```

### Production Build
```bash
npm run build
```

## Deploying to Netlify

### 1. Manual Deployment
1. Build the application: `npm run build`
2. Deploy the `build` directory to Netlify

### 2. Continuous Deployment
1. Connect your GitHub repository to Netlify
2. Set build command to: `npm run build`
3. Set publish directory to: `build`

## IoT Device Configuration

### For Real IoT Devices

1. Include the `iotDeviceHeartbeatService.ts` in your IoT device firmware
2. Initialize the service with the machine ID:
   ```javascript
   await IoTDeviceHeartbeatService.initialize('MACHINE_ID_HERE');
   ```

### For Testing (IoT Device Simulator)

1. Deploy the `iot-device-simulator.js` file to your IoT device
2. Edit the file to set your machine ID:
   ```javascript
   const CONFIG = {
     MACHINE_ID: 'YOUR_ACTUAL_MACHINE_ID',
     // ... other config
   };
   ```
3. Run the script on your IoT device

## Netlify Functions

The system includes a Netlify function for handling IoT device heartbeats:
- Function: `update-heartbeat.js`
- Endpoint: `/.netlify/functions/update-heartbeat`
- Method: POST
- Body: `{ "machineId": "machine_id", "deviceData": { ... } }`

## Troubleshooting

### Machines Not Showing as Online

1. Check that IoT devices are sending heartbeats
2. Verify Firebase database rules
3. Check browser console for errors
4. Ensure environment variables are correctly set

### Build Issues

1. Increase Node.js memory: `npm run build:memory`
2. Clear build cache: Delete `node_modules` and `build` folders, then run `npm install`

### Database Permission Errors

1. Check `database.rules.json` permissions
2. Verify user authentication and roles
3. Ensure machine IDs exist in the database

## Monitoring

### Development Tools

In development mode, several debugging tools are available in the browser console:

1. `MachineSimulator` - For heartbeat simulation
2. `RealIoTMonitoring` - For monitoring service control
3. `DebugMachineService` - For machine status debugging

### Production Monitoring

1. Check Firebase Realtime Database for heartbeat data
2. Monitor Netlify function logs
3. Use browser developer tools to check network requests

## Security Considerations

1. Never commit `.env` files to version control
2. Protect Firebase Admin SDK credentials
3. Regularly audit database rules
4. Use HTTPS for all communications
5. Implement proper authentication and authorization

## Support

For issues with the system, contact the development team or check the console logs for error messages.