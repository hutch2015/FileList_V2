({
    doInit : function(component, event, helper) {
        var items = [{ label: "Download", value: "download" },{ label: "View File Details", value: "view_file_details" },{ label: "Edit File Details", value: "edit_file_details" },{ label: "Delete", value: "delete" },{ label: "Share", value: "share" }];
        component.set("v.ownerActions", items);
        items = [{ label: "Download", value: "download" },{ label: "View File Details", value: "view_file_details" },{ label: "Share", value: "share" }];
        component.set("v.viewerActions", items);
        items = [{ label: "Download", value: "download" },{ label: "View File Details", value: "view_file_details" },{ label: "Edit File Details", value: "edit_file_details" },{ label: "Share", value: "share" }];
        component.set("v.collaboratorActions", items);
        helper.getData(component);
        helper.getObjectName(component);
        helper.getUserIdAndPermission(component);
        helper.getUserSharePermissions(component);
        helper.getFields(component);
        setInterval(function(){
            var minutes = component.get("v.minutes");
            component.set("v.minutes",minutes + 1);
        },60000);
        var options = [{label:"Viewer",value:"V",selected:true},{label:"Collaborator",value:"C",selected:false}];
        component.set("v.options",options);
    },
    refresh : function(component, event, helper) {
        $A.get('e.force:refreshView').fire();
        component.set("v.minutes",0);
    },
    openFile: function(component, event, helper){
        $A.get('e.lightning:openFiles').fire({
            recordIds: [event.currentTarget.id]
        });
    },
    viewOwner: function(component, event, helper){
        var navigateEvent = $A.get("e.force:navigateToSObject");
        navigateEvent.setParams({
            "recordId": event.currentTarget.id
        });
        navigateEvent.fire();
    },
    handleMenuSelect: function (component, event, helper) {
        var action = event.getParams();
        var value = action.value.split("--")[2];
        var contentDocumentId = action.value.split("--")[1];
        var id = action.value.split("--")[0];
        var ownerId = action.value.split("--")[3];
        component.set("v.viewAll",false);
        switch (value) {
            case 'download':
                var urlEvent = $A.get("e.force:navigateToURL");
                urlEvent.setParams({
                    "url": "/sfc/servlet.shepherd/version/download/"+id
                });
                urlEvent.fire();
                break;
            case 'view_file_details':
                helper.showOrHide(component,contentDocumentId,false);
                break;
            case 'edit_file_details':
                var editRecordEvent = $A.get("e.force:editRecord");
                editRecordEvent.setParams({
                    "recordId": id
                });
                editRecordEvent.fire();
                break;
            case 'delete':
                component.set("v.isOpen",true);
                component.set("v.contentDocumentId", contentDocumentId);
                break;
            case 'share':
                component.set("v.openShare",true);
                component.set("v.ownerId", ownerId);
                component.set("v.contentVersionId", id);
                component.set("v.contentDocumentId", contentDocumentId);
                helper.getFileAccessData(component, contentDocumentId);
                break; 
        }
    },
    close :function(component, event, helper){
        var id = event.currentTarget.id;
        helper.showOrHide(component,id,true);
        component.set("v.viewAll",false);
    },
    showMessage : function(component, event, helper){
        var id = event.currentTarget.id;
        helper.showOrHide(component,id,true);
        $A.get('e.force:refreshView').fire();
        var toastEvent = $A.get("e.force:showToast");
        toastEvent.setParams({
            "mode" : "dismissible",
            "duration" : 1000,
            "type" : "success",
            "title": "Success!",
            "message": "The file has been updated successfully."
        });
        toastEvent.fire();
    },
    updateColumnSorting: function (component, event, helper) {
        var fieldName = event.currentTarget.id.split("--")[0];
        var fieldNameLabel = event.currentTarget.id.split("--")[1];
        var sortDirection = event.currentTarget.id.split("--")[2];
        component.set("v.sortedDirection", sortDirection);
        component.set("v.sortedBy", fieldNameLabel);
        helper.sortData(component, fieldName, sortDirection);
        component.set("v.minutes",0);
        component.set("v.viewAll",false);
    },
    calculateWidth : function(component, event, helper) {
        var childObj = event.target
        var parObj = childObj.parentNode;
        var count = 1;
        while(parObj.tagName != 'TH') {
            parObj = parObj.parentNode;
            count++;
        }
        var mouseStart=event.clientX;
        component.set("v.mouseStart",mouseStart);
        component.set("v.oldWidth",parObj.offsetWidth);
    },
    setNewWidth : function(component, event, helper) {
        var childObj = event.target;
        var parObj = childObj.parentNode;
        var count = 1;
        while(parObj.tagName != 'TH') {
            parObj = parObj.parentNode;
            count++;
        }
        var mouseStart = component.get("v.mouseStart");
        var oldWidth = component.get("v.oldWidth");
        var newWidth = event.clientX- parseFloat(mouseStart) + parseFloat(oldWidth);
        parObj.style.width = newWidth+'px';
        component.set("v.resetWidth", true);
    },
    dropDown : function(component, event){
        var currentTarget = component.find('settings');
        $A.util.toggleClass(currentTarget,'slds-is-open');
    },
    shareIconDropDown : function(component, event){
        var currentTarget = component.find('shareIcon');
        console.log(currentTarget);
        $A.util.toggleClass(currentTarget,'slds-is-open');
    },
    resetColumnWidth : function(component, event, helper){
        $A.get('e.force:refreshView').fire();
        component.set("v.resetWidth", false);
        component.set("v.minutes",0);
    },
    closeModel : function(component,event,helper){
        component.set("v.isFileOpen",false);
        component.set("v.isOpen",false);
        component.set("v.viewAll",false);
        component.set("v.openShare",false);
        component.set("v.openAccessView",false);
        component.set("v.unshare",false);
        component.set("v.selectedLookUpRecords",[]);
        component.set("v.selectedLookUpRecordsLength",0);
    },
    doSave: function(component, event, helper) {
        if (component.find("fileId").get("v.files").length > 0) {
            var fileLength = component.find("fileId").get("v.files").length;
            var files = component.find("fileId").get("v.files");
            for(var i = 0; i < fileLength; i++){
                helper.uploadHelper(component, event,files[i]); 
            }	
        } else {
            alert('Please Select a Valid File');
        }
    },
    
    handleFilesChange: function(component, event, helper) {
        var fileName = 'No File Selected..';
        if (event.getSource().get("v.files").length > 0) {
            fileName = '';
            var fileLength = event.getSource().get("v.files").length;
            for(var i = 0; i < fileLength; i++){
                fileName = fileName + event.getSource().get("v.files")[i]['name'] + '\n';  
            }
            var fileLength = event.getSource().get("v.files").length;
        }
        component.set("v.fileName", fileName);
        component.set("v.fileLength",fileLength);
    },
    createRecord : function(component,event,helper){
        /*var createRecordEvent = $A.get("e.force:createRecord");
        createRecordEvent.setParams({
            "entityApiName": "Case"
        });
        createRecordEvent.fire();*/
        component.set("v.isFileOpen",true);
        component.set("v.viewAll",false);
    },
    viewOrCollapseAllData : function(component,event){
        var parentId = component.find('table--view');
        var childNodes = parentId.get("v.body")[1].getElements()[0].childNodes;
        var attachments = component.get("v.attachments");
        var i,j;
        var hide = component.get("v.viewAll");
        for (j = 0; j < attachments.length; j++){
            for (i = 0; i < childNodes.length; i++){
                if(childNodes[i].id == attachments[j].ContentDocumentId && !hide){
                    $A.util.removeClass(childNodes[i], 'slds-hide');
                }
                else if(childNodes[i].id.indexOf('edit--') > -1 && !hide){
                    $A.util.addClass(childNodes[i], 'slds-hide'); 
                }
                if(childNodes[i].id == attachments[j].ContentDocumentId && hide){
                    $A.util.addClass(childNodes[i], 'slds-hide'); 
                }
            }
        }
        hide = (!hide) ? true : false;
        component.set("v.viewAll",hide);
    },
    deleteRow : function(component,event,helper){
        var contentDocumentId = event.currentTarget.id;
        helper.getRowData(component,contentDocumentId);
    },
    openShareAccordian : function(component,event,helper){
        var openAccessView = component.get("v.openAccessView");
        openAccessView = (openAccessView) ? false : true;
        component.set("v.openAccessView",openAccessView);
    },
    deleteShare : function(component,event,helper){
        var linkedEntityId = event.currentTarget.id.split("--")[0];
        var contentVersionId = event.currentTarget.id.split("--")[1];
        var contentDocumentId = event.currentTarget.id.split("--")[2];
        helper.deleteShareData(component, linkedEntityId,contentVersionId,contentDocumentId);
        component.set("v.unshare",false);
    },
    doShare : function(component,event,helper){
        var selectedPeople = component.get("v.selectedLookUpRecords");
        var ids = [];
        selectedPeople.forEach(function(element) {
            ids.push(element.Id);
        });
        var contentDocumentId = event.currentTarget.id.split("--")[0];
        var shareType = component.get("v.infoText");
        var contentVersionId = event.currentTarget.id.split("--")[1];
        helper.doShare(component,ids,contentDocumentId,shareType,contentVersionId);
        component.set("v.openShare",false);
    },
    openDeleteShare : function(component,event,helper){
        var id = event.currentTarget.id.split("--");
        var linkedEntityId = id[0];
        var name = id[1];
        component.set("v.linkedEntityId", linkedEntityId);
        component.set("v.userName", name);
        component.set("v.unshare",true);
    },
    cancelShare : function(component,event,helper){
    	component.set("v.unshare",false);
    },
    selectUpdateChange : function(component, event, helper) {
    	var contentDocumentId = component.get("v.contentDocumentId");
        var linkedEntityId = event.getParam("linkedEntityId");
        var labels = event.getParam("labels");
        var shareType = labels[0];
        if(linkedEntityId != null){
            $A.util.addClass(component.find("mySpinner"), "slds-show");
            helper.updateOnChange(component,shareType,contentDocumentId,linkedEntityId);    
        }
    },
    save : function(component, event, helper) {
        var ctarget = event.currentTarget;
        var updateId = ctarget.dataset.value;
        console.log(updateId, component.getGlobalId());
        console.log(document.getElementById(updateId));
        component.find("update").get("e.recordSave").fire();
    },
    setObject : function(component, event, helper) {
    	var id = event.currentTarget.id;
        component.set("v.searchObjectName",id);
        if(id == "collaborationgroup"){
            component.set("v.searchIconName","standard:groups");
        }else{
             component.set("v.searchIconName","standard:user");
        }
    },
    openToolTip : function(component, event, helper) {
    	var toolTip = component.find("help");
        $A.util.addClass(toolTip,'slds-show');
    },
    closeToolTip : function(component, event, helper) {
    	var toolTip = component.find("help");
        $A.util.removeClass(toolTip,'slds-show');
    },
    updateSharingPrivacy : function(component, event, helper) {
    	var contentVersionId = event.currentTarget.id;
        helper.updateSharingPrivacy(component,contentVersionId);
    },
    handleUploadFinished: function (component, event) {
        var uploadedFiles = event.getParam("files");
        var refreshAction = component.get('c.refresh');
        $A.enqueueAction(refreshAction);
    }
})