({
    // Used to get the attachments
    getData : function(component) {
        var recordId = component.get("v.recordId");
        var column1 = component.get("v.column1");
        var column2 = component.get("v.column2");
        var column3 = component.get("v.column3");
        var column4 = component.get("v.column4");
        var column5 = component.get("v.column5");
        var column6 = component.get("v.column6");
        var column7 = component.get("v.column7");
        var action = component.get("c.getAttachmentsById");
        action.setParams({
            "recordId": recordId
        });
        action.setCallback(this, function (response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                var responseData = response.getReturnValue();
                var columns = [column1, column2, column3, column4, column5, column6, column7];
                console.log("Columns : ", columns)
                for(var i = 0; i < columns.length; i++){
                    if(columns[i]){
                     	for(var j = 0; j < responseData.length; j++){
                            if(columns[i].toLowerCase().indexOf('date') >= 0){
                                responseData[j]['column'+(i+1)] = $A.localizationService.formatDate(responseData[j][columns[i]], "MMM d, yyyy h:mm a");
                            }
                            else if(columns[i].toLowerCase().indexOf('.') >= 0){
                                component.set("v.column"+(i+1), columns[i].split(".")[0])
                                var columnSplitted = columns[i].split(".");
                                responseData[j]['column'+(i+1)] = responseData[j][columnSplitted[0]][columnSplitted[1]];
                            }else if(columns[i].toLowerCase().indexOf('size') >= 0){
                                var size = responseData[j][columns[i]];
                                if(size < 1024 && size > 0){
                                    size = parseInt(size)+' B';
                                }else if(size < 1024*1024 && size > 1024){
                                    size = parseFloat(size/1024).toFixed(1)+' KB';
                                }else if(size < 1024*1024*1024 && size > 1024*1024){
                                    size = parseFloat(size/(1024*1024)).toFixed(1)+' MB';
                                }else if(size < 1024*1024*1024*1024 && size > 1024*1024*1024){
                                    size = parseFloat(size/(1024*1024*1024)).toFixed(1)+' GB';
                                }
                                responseData[j]['column'+(i+1)] = size;
                            }else{
                                responseData[j]['column'+(i+1)] = responseData[j][columns[i]];
                            }
                        }   
                    }
                }                
                component.set("v.attachments", responseData);
                component.set("v.attachmentsLength", responseData.length);
            } else if (state === "ERROR") {
                var errors = response.getError();
                console.error(errors);
            }
        });
        $A.enqueueAction(action);
    },
    // Used to hide or show view/edit accordion
    showOrHide : function(component, id, hide){
        var parentId = component.find('table--view');
        var viewAll = component.get("v.viewAll");
        var childNodes = parentId.get("v.body")[1].getElements()[0].childNodes;
        for (var i = 0; i < childNodes.length; i++){
            if(childNodes[i].id == id && !hide){
                $A.util.removeClass(childNodes[i], 'slds-hide');
            }
            else if(childNodes[i].id != id && 0 !== childNodes[i].id.length){
                $A.util.addClass(childNodes[i], 'slds-hide'); 
            }
            if(childNodes[i].id == id && hide){
                $A.util.addClass(childNodes[i], 'slds-hide');   
            }
            else if(childNodes[i].id.indexOf('edit--') == -1 && hide && viewAll){
                $A.util.removeClass(childNodes[i], 'slds-hide');   
            }
        }
    },
    // Get the object details for breadcrumb
    getObjectName : function(component){
        var recordId = component.get("v.recordId");
        var action = component.get("c.findObjectAPIName");
        action.setParams({
            "recordId" : recordId
        });
        action.setCallback(this, function(response) {
            var objectDetails = response.getReturnValue();
            component.set("v.objectName", objectDetails[0]);
            component.set("v.parentEntity", objectDetails[1]);
            component.set("v.parentRecordName", objectDetails[2]);
        });
        $A.enqueueAction(action);
    },
    // Used to get the user data access to the content
    getUserIdAndPermission : function(component){
        var action = component.get("c.getUserIdAndPermission");
        action.setCallback(this, function(response){
            var state = response.getState();
            if (state === "SUCCESS") {
                var responseData = response.getReturnValue();
                component.set("v.userId", responseData[0]);
                component.set("v.userPermission", responseData[1]);
            }
        });
        $A.enqueueAction(action);
    },
    // Used to sort the rows based on column
    sortData: function (component, fieldName, sortedDirection) {
        var data = component.get("v.attachments");
        var reverse = sortedDirection !== 'asc';
        data.sort(this.sortBy(fieldName, reverse))
        component.set("v.attachments", data);
        if(reverse)
            component.set("v.sortedDirection", 'asc');
        else
            component.set("v.sortedDirection", 'desc');
    },
    // Used to determine the direction of sort
    sortBy: function (field, reverse, primer) {
        var key = primer ?
            function(x) {return primer(x[field])} :
        function(x) {return x[field]};
        reverse = !reverse ? 1 : -1;
        return function (a, b) {
            return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
        }
    },
    MAX_FILE_SIZE: 2147483648,
    CHUNK_SIZE: 750000,  
    // Used to upload file in chunks
    uploadHelper: function(component, event, file) {
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
            self.uploadProcess(component, file, fileContents);
        });
        
        objFileReader.readAsDataURL(file);
    },
    
    uploadProcess: function(component, file, fileContents) {
        var startPosition = 0;
        var endPosition = Math.min(fileContents.length, startPosition + this.CHUNK_SIZE);
        
        this.uploadInChunk(component, file, fileContents, startPosition, endPosition, '');
    },
    
    
    uploadInChunk: function(component, file, fileContents, startPosition, endPosition, attachId) {
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
                    this.uploadInChunk(component, file, fileContents, startPosition, endPosition, attachId);
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
                    component.set("v.isFileOpen",false);
                    this.getData(component);
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
    // Used to delete the attachment
    deleteRow: function(component, row) {
        var action = component.get("c.deleteAttachment");
        action.setParams({
            "contentVersion":row
        });
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                this.getData(component);
                $A.get('e.force:refreshView').fire();    
                var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({
                    "mode" : "dismissible",
                    "duration" : 1000,
                    "type" : "success",
                    "title": "Success!",
                    "message": "The record has been deleted successfully."
                });
                toastEvent.fire();
            }
            else if (state === "ERROR") {
                var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({
                    "mode" : "dismissible",
                    "duration" : 1000,
                    "type" : "error",
                    "title": "Error!",
                    "message": "The record deletion failed."
                });
            }
        });
        $A.enqueueAction(action);
    },
    // Used to get single attachment details
    getRowData : function(component,contentDocumentId) {
        var action = component.get("c.getAttachmentByContentId");
        action.setParams({
            "contentDocumentId": contentDocumentId
        });
        action.setCallback(this, function (response) {
            var state = response.getState();
            var responseData = response.getReturnValue();
            if (state === "SUCCESS") {
                this.deleteRow(component, responseData);
            } else if (state === "ERROR") {
                var errors = response.getError();
                console.error(errors);
            }
        });
        $A.enqueueAction(action);
    },
    // Get the fields related to content version
    getFields : function(component) {
        var fieldsOne = [];
        var fieldsTwo = [];
        var action = component.get("c.getFields");
        action.setCallback(this, function (response) {
            var state = response.getState();
            var responseData = response.getReturnValue();
            if (state === "SUCCESS") {
                for(var i=0; i < responseData.length; i++){
                    if((i+1) % 2 == 0){
                        fieldsTwo.push(responseData[i]);
                    }
                    else{
                        fieldsOne.push(responseData[i]);
                    }
                }
                component.set("v.fieldsOne",fieldsOne);
                component.set("v.fieldsTwo",fieldsTwo);
            } else if (state === "ERROR") {
                var errors = response.getError();
                console.error(errors);
            }
        });
        $A.enqueueAction(action);
    },
    // Used to get the user based attachment share access details
    getUserSharePermissions : function(component){
        var action = component.get("c.getUserSharePermissions");
        action.setCallback(this, function(response){
            var state = response.getState();
            if (state === "SUCCESS") {
                var responseData = response.getReturnValue();
                component.set("v.userSharePermissionData", responseData);
            }
            else if (state === "ERROR") {
                var errors = response.getError();
                console.error(errors);
            }
        });
        $A.enqueueAction(action);
    },
    // Used to get the attachment related share access data
    getFileAccessData : function(component,recordId){
        var action = component.get("c.getFileAccessData");
        action.setParams({
            "recordId": recordId
        });
        action.setCallback(this, function(response){
            var state = response.getState();
            if (state === "SUCCESS"){
                var responseData = response.getReturnValue();
                var actionData = [];
                for(var j = 0; j < responseData.length-1; j++){
                    var rowData = {};
                    var objectName = responseData[j].iconName;
                    var shareType = responseData[j].shareType;
                    var linkedEntityId = responseData[j].linkedEntityId;
                    var actionDropDown;
                    if(objectName == 'collaborationgroup'){
                        rowData["iconName"] = "groups";
                    }else{
                        rowData["iconName"] = objectName;
                    }	
                    rowData["name"] = responseData[j].name;
                    if(objectName == 'user' || objectName == 'collaborationgroup'){
                        if(shareType == 'I'){
                            component.set("v.contentOwnerId", linkedEntityId);
                            actionDropDown = [{ label: "Owner", value: "I", selected:true}];
                            rowData["accessMenuAction"] = actionDropDown;
                            rowData["infoText"] = "Owner";
                        }
                        else if(shareType == 'C'){
                            actionDropDown = [{ label: "Viewer", value: "V", selected:false},{ label: "Collaborator", value: "C", selected:true}];
                            rowData["accessMenuAction"] = actionDropDown;
                            rowData["infoText"] = "Collaborator";
                        }
                            else{
                                actionDropDown = [{ label: "Viewer", value: "V", selected:true},{ label: "Collaborator", value: "C", selected:false}];
                                rowData["accessMenuAction"] = actionDropDown;
                                rowData["infoText"] = "Viewer";
                            }
                    }else{
                        actionDropDown = (shareType == 'I') ? actionDropDown = [{ label: "Viewer", value: "V", selected:false},{ label: "Set by Record", value: "I", selected:true}] :
                        [{ label: "Viewer", value: "V", selected:true},{ label: "Set by Record", value: "I", selected:false}];
                        rowData["accessMenuAction"] = actionDropDown;
                        rowData["infoText"] = (shareType == 'I') ? "Set by Record" : "Viewer";
                    }
                    rowData["linkedEntityId"] = responseData[j].linkedEntityId;
                    actionData.push(rowData);
                } 
                component.set("v.accessContentData", actionData);
                component.set("v.sharingOption", responseData[responseData.length-1].sharingOption);
            }
            else if (state === "ERROR") {
                var errors = response.getError();
                console.error(errors);
            }
        });
        $A.enqueueAction(action);
    },
    // Used to delete the share access of content to particular user or group
    deleteShareData : function(component, linkedEntityId,contentVersionId,contentDocumentId){
        var action = component.get("c.deleteShareData");
        action.setParams({
            "linkedEntityId": linkedEntityId,
            "contentVersionId" : contentVersionId,
            "contentDocumentId" : contentDocumentId
        });
        action.setCallback(this, function(response){
            var state = response.getState();
            if (state === "SUCCESS"){
                var recordId = response.getReturnValue();
                this.getFileAccessData(component,recordId);
                var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({
                    "mode" : "dismissible",
                    "duration" : 1000,
                    "type" : "success",
                    "title": "Success!",
                    "message": "Unshare the file has been done successfully."
                });
                toastEvent.fire();
            }
            else if (state === "ERROR") {
                var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({
                    "mode" : "dismissible",
                    "duration" : 1000,
                    "type" : "error",
                    "title": "Error!",
                    "message": "Unshare data failed."
                });
            }
        });
        $A.enqueueAction(action);
    },
    // Share the attachment to list of users or group
    doShare : function(component,ids,contentDocumentId,shareType,contentVersionId){ 
        var action = component.get("c.shareOrUpdateContent");
        action.setParams({
            "ids": ids,
            "contentDocumentId" : contentDocumentId,
            "shareType" : shareType,
            "contentVersionId": contentVersionId
        });
        action.setCallback(this, function(response){
            var state = response.getState();
            if (state === "SUCCESS"){
                if(ids.length > 0){
                    component.set("v.selectedLookUpRecords",[]);
                    component.set("v.selectedLookUpRecordsLength",0);
                    this.getFileAccessData(component,contentDocumentId);
                    $A.get('e.force:refreshView').fire();
                    var toastEvent = $A.get("e.force:showToast");
                    toastEvent.setParams({
                        "mode" : "dismissible",
                        "duration" : 1000,
                        "type" : "success",
                        "title": "Success!",
                        "message": "The file has been shared successfully."
                    });
                    toastEvent.fire();   
                } 
            }
            else if (state === "ERROR") {
                component.set("v.selectedLookUpRecords",[]);
                component.set("v.selectedLookUpRecordsLength",0);
                var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({
                    "mode" : "dismissible",
                    "duration" : 1000,
                    "type" : "error",
                    "title": "Error!",
                    "message": "The file sharing is failed."
                });
            }
        });
        $A.enqueueAction(action);
    },
    // Update the share type of the attachment of a particular user
    updateOnChange :  function(component,shareType,contentDocumentId,linkedEntityId){
        var action = component.get("c.updateOnChange");
        action.setParams({
            "linkedEntityId": linkedEntityId,
            "contentDocumentId" : contentDocumentId,
            "shareType" : shareType
        });
        action.setCallback(this, function(response){
            $A.util.removeClass(component.find("mySpinner"), "slds-show");
            var state = response.getState();
            if (state === "SUCCESS"){
                this.getFileAccessData(component,contentDocumentId);
            }
        });
        $A.enqueueAction(action);
    },
    //Used update the sharing option to prevent share or unshare attachment
    updateSharingPrivacy : function(component,contentVersionId){
        var action = component.get("c.updateSharePrivacy");
        action.setParams({
            "contentVersionId": contentVersionId
        });
        action.setCallback(this, function(response){
            var state = response.getState();
            if (state === "SUCCESS"){
                component.set("v.sharingOption",response.getReturnValue());
            }
            else{
               var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({
                    "mode" : "dismissible",
                    "duration" : 1000,
                    "type" : "error",
                    "title": "Error!",
                    "message": "Sharing option updation failed."
                }); 
            }
        });
        $A.enqueueAction(action);
    }
})