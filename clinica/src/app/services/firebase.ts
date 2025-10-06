// src/app/services/firebase.service.ts
import { Injectable } from '@angular/core';
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from 'firebase/storage';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  app;
  db;
  auth;
  storage;

  constructor() {
    const firebaseConfig = {
      apiKey: "AIzaSyDHJGMQKOkye1Wz3XNK5CNAVpFBQg2hdqk",
      authDomain: "clinica-online-6537c.firebaseapp.com",
      projectId: "clinica-online-6537c",
      storageBucket: "clinica-online-6537c.appspot.com",
      messagingSenderId: "13812693037",
      appId: "1:13812693037:web:bf59a9d38f44ca15d2e0a4",
      measurementId: "G-NX3ZRXWEWR"
    };

    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
    this.auth = getAuth(this.app);
    this.storage = getStorage(this.app);
  }
}
