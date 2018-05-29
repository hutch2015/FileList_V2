({
    MAX_FILE_SIZE: 2147483648,
    CHUNK_SIZE: 750000,  
    // Used to upload files in chunks
    uploadHelper: function(component, event,file) {
        component.set("v.showLoadingSpinner", true);
        var self = this;
        if (file.size > self.MAX_FILE_SIZE) {
            component.set("v.showLoadingSpinner", false);
            component.set("v.fileName", 'Alert : File size cannot exceed ' + self.MAX_FILE_SIZE + ' bytes.\n' + ' Selected file size: ' + file.size);
            return;
        }
        
        var objFileReader = new FileReader();
        objFileReader.onload = $A.getCallback(function() {
            var fileContents = objFileReader.result;
            var base64 = 'base64,';
            var dataStart = fileContents.indexOf(base64) + base64.length;
            
            fileContents = fileContents.substring(dataStart);
            self.uploadProcess(component, event, file, fileContents);
        });
        
        objFileReader.readAsDataURL(file);
    },
    
    uploadProcess: function(component, event, file, fileContents) {
        var startPosition = 0;
        var endPosition = Math.min(fileContents.length, startPosition + this.CHUNK_SIZE);
        
        this.uploadInChunk(component, event, file, fileContents, startPosition, endPosition, '');
    },

    uploadInChunk: function(component, event, file, fileContents, startPosition, endPosition, attachId) {
        var getchunk = fileContents.substring(startPosition, endPosition);
        var action = component.get("c.saveChunk");
        action.setParams({
            firstPublishLocationId: component.get("v.recordId"),
            pathOnClient: file.name,
            title: file.name.split(".")[0],
            base64Data: encodeURIComponent(getchunk),
            fileId: attachId
        });
        action.setCallback(this, function(response) {
            attachId = response.getReturnValue();
            var state = response.getState();
            if (state === "SUCCESS") {
                startPosition = endPosition;
                endPosition = Math.min(fileContents.length, startPosition + this.CHUNK_SIZE);
                if (startPosition < endPosition) {
                    this.uploadInChunk(component, event, file, fileContents, startPosition, endPosition, attachId);
                } else {
                    var toastEvent = $A.get("e.force:showToast");
                    toastEvent.setParams({
                        "mode" : "dismissible",
                        "duration" : 1000,
                        "type" : "success",
                        "title": "Success!",
                        "message": "The file has been uploaded successfully."
                    });
                    toastEvent.fire();
                    component.set("v.showLoadingSpinner", false);
                    component.set("v.isOpen",false);
                    this.getData(component, event);
                }    
            } else if (state === "INCOMPLETE") {
                var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({
                    "mode" : "dismissible",
                    "duration" : 1000,
                    "type" : "error",
                    "title": "Error!",
                    "message": response.getReturnValue()
                });
            } else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        var toastEvent = $A.get("e.force:showToast");
                        toastEvent.setParams({
                            "mode" : "dismissible",
                            "duration" : 1000,
                            "type" : "error",
                            "title": "Error!",
                            "message": errors[0].message
                        });
                    }
                } else {
                    var toastEvent = $A.get("e.force:showToast");
                    toastEvent.setParams({
                        "mode" : "dismissible",
                        "duration" : 1000,
                        "type" : "error",
                        "title": "Error!",
                        "message": "Unknown error"
                    });
                }
            }
        });
        $A.enqueueAction(action);
    },
    //Used to get the attachments
    getData : function(component,event){
        var recordId = component.get("v.recordId");
        var action = component.get("c.getAttachmentsById");
        action.setParams({
            "recordId": recordId
        });
        action.setCallback(this, function(res) {
            console.log('Was I successful? ' + res.getState());
            var state = res.getState(); 
            if(component.isValid() && state === "SUCCESS"){
             	var response = res.getReturnValue();
                console.log('Attachments : ',response)
                if(response.length > 6){
                    response = response.splice(0, 6);
                    // Limiting the record size to 6
                    component.set("v.attachments", response);
                    component.set("v.attachmentsLength", '6+');
                }
                else{
                    component.set("v.attachments", response);
                    component.set("v.attachmentsLength", response.length);
                }
                // Get the url to navigate to other components
                component.set("v.objectHomeUrl", window.location.href.substr(0,window.location.href.lastIndexOf("/")));
                component.set("v.orgUrl", window.location.href.substr(0,window.location.href.lastIndexOf("#")+1));
                component.set("v.hostName", window.location.protocol + "//" + window.location.hostname);   
            }else{
                console.log(res.getError());
            }
        });
        $A.enqueueAction(action);
    }
})