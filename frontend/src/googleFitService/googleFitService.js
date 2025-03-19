// src/googleFit/googleFitService.js
import { googleFitConfig } from './config';

class GoogleFitService {
  constructor() {
    this.isLoaded = false;
    this.isAuthenticated = false;
    this.tokenClient = null;
  }

  loadGoogleFitAPI() {
    return new Promise((resolve, reject) => {
      if (this.isLoaded && window.gapi) {
        resolve();
        return;
      }
      
      console.log("Starting to load Google Fit API");
      
      // Load the newer GIS script
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.async = true;
      gisScript.defer = true;
      
      // Also load the gapi script for the fitness API calls
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.async = true;
      gapiScript.defer = true;
      
      let gisLoaded = false;
      let gapiLoaded = false;
      
      gisScript.onload = () => {
        console.log("Google Identity Services script loaded");
        gisLoaded = true;
        if (gapiLoaded) initializeApis();
      };
      
      gapiScript.onload = () => {
        console.log("Google API script loaded");
        gapiLoaded = true;
        if (gisLoaded) initializeApis();
      };
      
      const initializeApis = () => {
        window.gapi.load('client', () => {
          console.log("Client library loaded, initializing client");
          
          window.gapi.client.init({
            apiKey: googleFitConfig.apiKey,
            discoveryDocs: googleFitConfig.discoveryDocs
          }).then(() => {
            console.log("Google API client initialized successfully");
            
            // Initialize the token client with the new GIS library
            this.tokenClient = google.accounts.oauth2.initTokenClient({
              client_id: googleFitConfig.clientId,
              scope: googleFitConfig.scope,
              callback: (response) => {
                if (response.error) {
                  console.error("Token response error:", response);
                  this.isAuthenticated = false;
                } else {
                  this.isAuthenticated = true;
                  console.log("Authentication successful");
                }
              }
            });
            
            this.isLoaded = true;
            resolve();
          }).catch(error => {
            console.error("Google API init error:", error);
            const errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error));
            console.error("Full error details:", errorDetails);
            reject(`Failed to initialize Google API client: ${errorDetails}`);
          });
        });
      };
      
      gisScript.onerror = (e) => {
        console.error("GIS script loading error:", e);
        reject("Failed to load Google Identity Services");
      };
      
      gapiScript.onerror = (e) => {
        console.error("GAPI script loading error:", e);
        reject("Failed to load Google API script");
      };
      
      document.body.appendChild(gisScript);
      document.body.appendChild(gapiScript);
    });
  }

  signIn() {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.isLoaded) {
          await this.loadGoogleFitAPI();
        }
        
        if (!this.tokenClient) {
          throw new Error("Token client not initialized");
        }
        
        // Request an access token
        this.tokenClient.requestAccessToken({
          prompt: 'consent'
        });
        
        // We can't directly return a value here because the tokenClient works with callbacks
        // The authentication status will be updated in the callback
        
        // Add an event listener to check when authentication status changes
        const checkAuth = setInterval(() => {
          if (this.isAuthenticated) {
            clearInterval(checkAuth);
            resolve(true);
          }
        }, 500);
        
        // Set a timeout to prevent hanging
        setTimeout(() => {
          clearInterval(checkAuth);
          if (!this.isAuthenticated) {
            reject("Authentication timed out");
          }
        }, 60000); // 1 minute timeout
        
      } catch (error) {
        console.error("Sign in error:", error);
        reject(error.toString());
      }
    });
  }

  signOut() {
    return new Promise((resolve) => {
      if (this.isAuthenticated && google && google.accounts && google.accounts.oauth2) {
        google.accounts.oauth2.revoke(
          window.gapi.client.getToken().access_token,
          () => {
            window.gapi.client.setToken(null);
            this.isAuthenticated = false;
            resolve(true);
          }
        );
      } else {
        this.isAuthenticated = false;
        resolve(false);
      }
    });
  }

  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  fetchStepData(startTimeMillis, endTimeMillis) {
    if (!this.isAuthenticated) {
      return Promise.reject(new Error('User is not authenticated'));
    }

    return window.gapi.client.request({
      path: 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
      method: 'POST',
      body: {
        aggregateBy: [{
          dataTypeName: 'com.google.step_count.delta',
          dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
        }],
        bucketByTime: { durationMillis: 86400000 }, // Daily buckets
        startTimeMillis: startTimeMillis,
        endTimeMillis: endTimeMillis
      }
    });
  }

  fetchHeartRateData(startTimeMillis, endTimeMillis) {
    if (!this.isAuthenticated) {
      return Promise.reject(new Error('User is not authenticated'));
    }

    return window.gapi.client.request({
      path: 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
      method: 'POST',
      body: {
        aggregateBy: [{
          dataTypeName: 'com.google.heart_rate.bpm',
          dataSourceId: 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm'
        }],
        bucketByTime: { durationMillis: 86400000 }, // Daily buckets
        startTimeMillis: startTimeMillis,
        endTimeMillis: endTimeMillis
      }
    });
  }
}

export const googleFitService = new GoogleFitService();