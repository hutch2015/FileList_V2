({
  	// Init Function
    doInit : function(component, event, helper) {
        helper.getData(component, event);
    },
    // Used to open the upload file dialog box
    openFile: function(component, event, helper){
        $A.get('e.lightning:openFiles').fire({
            recordIds: [event.currentTarget.id]
        });
    },
    // Used to navigate to the other component
    navigate : function(component, event) {
        var recordId = component.get("v.recordId");
        var attachments = component.get("v.attachments");
        var attachmentsLength = component.get("v.attachmentsLength");
        var objectHomeUrl = component.get("v.objectHomeUrl");
        var hostName = component.get("v.hostName");
        var column1 = component.get("v.column1");
        var column2 = component.get("v.column2");
        var column3 = component.get("v.column3");
        var column4 = component.get("v.column4");
        var column5 = component.get("v.column5");
        var column6 = component.get("v.column6");
        var column7 = component.get("v.column7");
        var navigateUrl = $A.get("e.force:navigateToComponent");
        navigateUrl.setParams({
            componentDef : "c:FileListView",
            componentAttributes: {
                recordId : recordId,
                objectHomeUrl : objectHomeUrl,
                hostName : hostName,
                column1 : column1,
                column2 : column2,
                column3 : column3,
                column4 : column4,
                column5 : column5,
                column6 : column6,
                column7 : column7
            }
        });
        navigateUrl.fire();
    },
    // Used to save the uploaded files
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
    // Triggered when the upload file count is changed
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
    closeModel : function(component,event,helper){
        component.set("v.isOpen", false);
    },
    createRecord : function(component,event,helper){
        component.set("v.isOpen",true);
    },
    handleUploadFinished: function (component, event) {
        var uploadedFiles = event.getParam("files");
        var refreshAction = component.get('c.doInit');
        $A.enqueueAction(refreshAction);
    }
    
})