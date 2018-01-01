   "use strict";
var PeerLib = function() {
var peers = [];
var connection;
var address;
var controller;

 function PeerLib() { 

 }

 
  PeerLib.prototype.getOnlineSwaps = function(){
   
  	for(var i = 0; i < peers.length;i++){
  		var aPeer = peers[i];
 
  		if(aPeer.address == self.address){
  				 
  			peers.splice(i, 1);
  			
  		}
  	}

  	return peers;
	
  }

    PeerLib.prototype.continueSwap = function(swapId,secretHash,address,hex){
  	var jsonData = {
  		"method":"swap:1",
  		"data":{
  		"address":address,
  		"secretHash":secretHash,
  		"swap_id":swapId,
  		"hex":hex
  		}
  	};
  	var json = JSON.stringify(jsonData);
  	console.log(json);
  	connection.send(json);
   

  }

    PeerLib.prototype.sendHex = function(swapId,address,hex){
  	var jsonData = {
  		"method":"swap:2",
  		"data":{
  		"address":address,
  		"swap_id":swapId,
  		"hex":hex
  		}
  	};
  	var json = JSON.stringify(jsonData);
  	console.log(json);
  	connection.send(json);
   

  }

  PeerLib.prototype.advertiseSwap = function(address,swapId,swapData){
  	var jsonData = {
  		"method":"advertise",
  		"data":{
  			"state":0,
  			"address":address,
  			"swap_id":swapId,
  			"get_token":swapData.get_token,
  			"get_amount":swapData.get_amount,
  			"give_token":swapData.give_token,
  			"give_amount":swapData.give_amount
  		}
  	};
  	var json = JSON.stringify(jsonData);
  	console.log(json);
  	 connection.send(json);
   

  }
PeerLib.prototype.connect = function (controller,address){
	self.controller = controller;
	self.address = address;
	//console.log(self.address);

	  // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
       console.log("doesnt support websockers");
        return;
    }

    // open connection
    connection = new WebSocket('wss://websocket-atomicswap.herokuapp.com/'+address);

    connection.onopen = function () {
        // first we want users to enter their names
        console.log("open");
        controller.connected = true;
        controller.connecting = false;
        controller.loadCurrentSwaps();
    };
     connection.onclose = function(){
     	 controller.connected = false;
        setTimeout(function(){
        connection = new WebSocket('wss://websocket-atomicswap.herokuapp.com/'+address);
        }, 1000);
    };

    connection.onerror = function (error) {
        console.log("e"+error);
        
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
         
        // try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }
        
         if(json.method == "online"){
         	 peers = json.data;
         	 console.log("method "+json.method); 
         }
         else if(json.method == "swap"){
         	  
         	 console.log(json);
         	 if(json.data.state == "start"){
         	 	console.log("starting swap");
         	 	self.controller.startSwap(json.data);
         	 }
         	 if(json.data.state == "wait"){
         	 	 
         	 	self.controller.startWait(json.data);
         	 }
         	 else if(json.data.state == "make"){


         	 	console.log("making swap");
         	 	var hex = json.data.hex;
         	 	if(self.controller.swapLib.verifyHex(hex) == true){
         	 		self.controller.saveTheirTransaction(json.data.swap_id,hex);
         	 		self.controller.makeSwap(json.data.secretHash,json.data.swap_id,json.data.data);

         	 		
         	 	}
         	  
         	 }
         	 else if(json.data.state == "check"){
         	 	self.controller.currentSwaps[json.data.swap_id].status = "a3";
         	 	var hex = json.data.hex;
         	 	if(self.controller.swapLib.verifyHex(hex) == true){
         	 		self.controller.saveTheirTransaction(json.data.swap_id,hex);
         	 		self.controller.broadcastBobs(json.data.swap_id);
         	 		console.log("checking swap "+hex);
         	 	}

         	 	 
         	  
         	 }
         	
         }
          
 
    };

  

    /**
     * This method is optional. If the server wasn't able to respond to the
     * in 3 seconds then show some error message to notify the user that
     * something is wrong.
     */
    setInterval(function() {
        if (connection.readyState !== 1) {
           console.log("cant connect to server");
        }
    }, 3000);

} 


 return PeerLib;

}();

     
 