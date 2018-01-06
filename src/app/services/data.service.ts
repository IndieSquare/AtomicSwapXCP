import { Injectable } from '@angular/core';

import { SwapItemComponent } from '../swap-item/swap-item.component';
import { PersistenceService, StorageType } from 'angular-persistence';
declare var PeerLib:any;
@Injectable()
export class DataService {
currentSwaps = {};
userSecretSeedMnemonic = "";
userWif = "";
userAddress = "";
peerLib;
swapObjects:any;
CONFIRMATIONS_NUM = 1;

  constructor(private persistenceService: PersistenceService) {
  	 this.peerLib = new PeerLib();
  	 this.swapObjects = [];
   }

  saveCurrentSwaps(){

 	this.persistenceService.set("currentSwapsV1"+this.userAddress, JSON.stringify(this.currentSwaps), {type: StorageType.LOCAL});
 }

  getLastSecretIndex(){
  	var lastIndex = this.persistenceService.get("lastSecretIndexV1",   StorageType.LOCAL);
    if(typeof lastIndex  == "undefined"){
     	 lastIndex = 0;
     	 
    } 

    this.persistenceService.set("lastSecretIndexV1", lastIndex+1 , {type: StorageType.LOCAL}); 
    return lastIndex;
  }

}

