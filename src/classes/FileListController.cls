public with sharing class FileListController {
    /**
     *	To get the namespace of the org
     *  @return nameSpacePrefix of the org
     */
    @AuraEnabled
    public static String getNamespace(){
        ApexClass cs =[select NamespacePrefix from ApexClass where Name =:'FileListController'];
        String nameSpacePrefix = cs.NamespacePrefix;
        return nameSpacePrefix;
    }
    
    
    /**
     *	To get the contentVersionQueryFields
     *  @return contentVersionFields with comma seperated 
     */
    public static String contentVersionQueryFields(){
       return String.join(new LIST<String>(ContentVersion.sObjectType.getDescribe().fields.getMap().keySet()), ',');
    }
    
    /**
     *	To get the AttachmentsById from fileListController
 	 *  @params recordID file related record id
     *  @return the Attachments of file
     */
    @AuraEnabled
    public static List<ContentVersion> getAttachmentsById(String recordId) {
        List<String> contentIds = getAttachmentsByString(recordId);
        List<ContentVersion> contentVersions = new List<ContentVersion>();
        if(contentIds.size() > 0){
            String query = 'SELECT '+ FileListController.contentVersionQueryFields().replace(',versiondata', '') + ',Owner.Name FROM ContentVersion ' + 'WHERE ContentDocumentId in ('+String.join(contentIds, ',')+') AND IsLatest = true';
            System.debug('Query : '+query);
            contentVersions = Database.query(query);
            System.debug('Content Versions : '+ contentVersions);
        }
        return contentVersions;
    }
    
    /**
     *	To get the AttachmentsByString
 	 *  @params recordID  file related record id
     *  @return the ContentDocumentId
     */
    @AuraEnabled
    public static List<String> getAttachmentsByString(String recordId) {
        List<String> ids = new List<String>();
        for(ContentDocumentLink contentDocument : [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId =: recordId]){
            ids.add('\''+ contentDocument.ContentDocumentId +'\''); 
        }
        return ids;
    }
    
     /**
     *	To get the Attachments
 	 *  @params recordID  file related record id
     *  @return list of ContentDocumentId
     */
    @AuraEnabled
    public static List<Id> getAttachments(String recordId) {
        List<Id> ids = new List<Id>();
        for(ContentDocumentLink contentDocument : [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId =: recordId]){
            ids.add(contentDocument.ContentDocumentId); 
        }
        return ids;
    }
    
     /**
     *	To get the UserSharePermissions
     *  @return the ContentDocument
     */
    @AuraEnabled
    public static List<ContentDocumentLink> getUserSharePermissions(){
        String userId = getUserId();
        return [SELECT ContentDocumentId,Id,ShareType FROM ContentDocumentLink WHERE LinkedEntityId =: userId];
    }
    
     /**
     *	To get the ObjectAPIName from recordID
 	 *  @params recordID  file related record id
     *  @return object details for the recordID
     */
    @AuraEnabled
    public static List<String> findObjectAPIName(id recordId){
        List<String> objectDetails = new List<String>();
        objectDetails.add(recordId.getSObjectType().getDescribe().getName());
        objectDetails.add(recordId.getSObjectType().getDescribe().getLabelPlural());
        String objectName = recordId.getSObjectType().getDescribe().getName();
        if(recordId.getSObjectType().getDescribe().getName() == 'Case'){
            List<Case> cases = [SELECT CaseNumber FROM Case WHERE Id =: recordId];
            if(cases.size() > 0){
                objectDetails.add(cases.get(0).CaseNumber); 
            }else{
                System.debug('Case number not found');
            }   
        }
        else if(recordId.getSObjectType().getDescribe().getName() == 'Solution'){
            objectDetails.add([SELECT SolutionName FROM Solution WHERE Id =: recordId].get(0).SolutionName);
        }
        else if(recordId.getSObjectType().getDescribe().getName() == 'Contract'){
            objectDetails.add([SELECT ContractNumber FROM Contract WHERE Id =: recordId].get(0).ContractNumber);
        }
        else{
            String query = 'SELECT Name FROM ' + objectName + ' WHERE Id = ' + '\'' + recordId  + '\'';
            List<SObject> sobjList = database.query(query);
            if(sobjList.size() > 0){
                SObject sobjectName = sobjList.get(0);
                String name = (String) sobjectName.get('Name');
                objectDetails.add(name);  
            }	
        } 
        return objectDetails;   
    }
    
     /**
     *	To get the UserId
     *  @return currentlogged in userId
     */
    @AuraEnabled
    public static String getUserId() {
        return UserInfo.getUserId();
    }
    
     /**
     *	To get the UserIdAndPermission
     *  @return userInfo contains details and permission
     */
    @AuraEnabled
    public static List<String> getUserIdAndPermission(){
        List<String> userInfo = new List<String>();
        String userId = getUserId();
        userInfo.add(userId);
        User userDetails = [SELECT Name,ProfileId, Profile.PermissionsModifyAllData,Profile.PermissionsEditPublicDocuments FROM User WHERE Id =: userId].get(0);
        String permission = (userDetails.Profile.PermissionsEditPublicDocuments) ? 'true' : 'false';
        userInfo.add(permission);
        return userInfo;
    }
    
     /**
     *	To get the AttachmentByContentId from ContentDocumentId
 	 *  @params ContentDocumentId  
     *  @return the contentVersion Attachment
     */
    @AuraEnabled
    public static ContentVersion getAttachmentByContentId (String contentDocumentId){
        List<ContentVersion> contentVersionData = [SELECT FileExtension,FileType,CreatedDate,ContentBodyId,ContentDocumentId,LastModifiedDate,OwnerId,FirstPublishLocationId,Id,ContentSize,Title,PathOnClient FROM ContentVersion WHERE ContentDocumentId =: contentDocumentId];
        ContentVersion contentVersion = new ContentVersion();
        if(contentVersionData.size() > 0){
            contentVersion = contentVersionData.get(0); 
        }
        return contentVersion;
    }
    
     /**
     *	To delete the Attachment
 	 *  @params contentVersion object to delete  
     *  @return contentVersion object after delete
     */
    @AuraEnabled
    public static ContentVersion deleteAttachment (ContentVersion contentVersion){
        try {
            System.debug('Version Id : '+contentVersion.ContentDocumentId);
            System.debug('Content Document Delete : '+[SELECT ParentId,Id,OwnerId,LastModifiedById,ArchivedById,ArchivedDate,ContentAssetId FROM ContentDocument WHERE Id =: contentVersion.ContentDocumentId]);
            if(contentVersion.ContentDocumentId == null){
                throw new DmlException('Content Version is null');
            }
            for(ContentDocument contentDocument : [SELECT ParentId,Id,OwnerId,LastModifiedById,ArchivedById,ArchivedDate,ContentAssetId FROM ContentDocument WHERE Id =: contentVersion.ContentDocumentId]){
                delete contentDocument;   
            }
        }
        catch(DMLException e){
            System.debug('DML Exception for deleteAttachment '+e);
        }
        return contentVersion;
    }
    
     /**
     *	To get the Fields from Object
     *  @return fields with Name,Description,Title,CreatedDate
     */
    @AuraEnabled
    public static List<String> getFields(){
        List<String> fields = new List<String>();
        fields.add('Title');
        fields.add('Description');
        Map<String, Schema.SObjectField> schemaFieldMap = ContentVersion.sObjectType.getDescribe().fields.getMap();
        for (SObjectField field : schemaFieldMap.values()){
            if(field.getDescribe().isUpdateable() && field.getDescribe().isAccessible() && field.getDescribe().isCreateable() && field.getDescribe().isCustom())
                fields.add(field.getDescribe().getName());
        }
        fields.add('CreatedDate');
        return fields; 
    } 
    
     /**
     *	To get the FileAccessData
     *  @params recordId file related record id
     *  @return object with sharingOption, type, linkedEntityId, iconName, name
     */
    @AuraEnabled
    public static List<Object> getFileAccessData(id recordId){
        List<Object> resultContent = new List<Object>();
        for (ContentDocumentLink content : [SELECT Id, LinkedEntityId, LinkedEntity.Name, ShareType FROM ContentDocumentLink WHERE ContentDocumentId =: recordId]){
            Map<String, String> rowData = new Map<String, String>();
            String objectName = content.LinkedEntityId.getSObjectType().getDescribe().getName();
            rowData.put('iconName', objectName.toLowercase());
            rowData.put('name', content.LinkedEntity.Name); 
            rowData.put('shareType', content.ShareType);
            rowData.put('linkedEntityId', content.LinkedEntityId);
            resultContent.add(rowData);
        }
        ContentDocument contentDocument = new contentDocument();
        if([SELECT SharingOption FROM ContentDocument WHERE Id =: recordId].size() > 0){
            contentDocument=[SELECT SharingOption FROM ContentDocument WHERE Id =: recordId].get(0);
        }
        Map<String, String> contentData = new Map<String, String>();
        contentData.put('sharingOption',contentDocument.SharingOption);
        resultContent.add(contentData);
        return resultContent;
    }
    
    /**
     *	To delete the ShareData
     *  @params linkedEntityId,contentVersionId,contentDocumentId
     *  @return ContentDocumentId of deleted share Content
     */
    @AuraEnabled
    public static String deleteShareData(id linkedEntityId, id contentVersionId, id contentDocumentId){
        List<ContentDocumentLink> contentDocumentLink = [SELECT Id, ContentDocumentId, ShareType, LinkedEntityId FROM ContentDocumentLink WHERE LinkedEntityId =: linkedEntityId AND ContentDocumentId =: contentDocumentId];
        ContentDocumentLink deleteContentShare = new ContentDocumentLink();
        try{
            if(contentDocumentLink.size() > 0){
                deleteContentShare = contentDocumentLink.get(0);
                delete deleteContentShare; 
        	}
            String objectName = linkedEntityId.getSObjectType().getDescribe().getName();
            System.debug('objectName : '+objectName);
            if(objectName == 'CollaborationGroup'){
                System.debug('linkedEntityId : '+linkedEntityId);
                List<FeedItem> feedIds = [SELECT Id, RelatedRecordId FROM FeedItem WHERE ParentId =: linkedEntityId];
                System.debug('Feed Ids : '+feedIds);
                for (FeedItem feed : feedIds){
                    System.debug('Feed Record Id : '+feed);
                    System.debug('Content Version Id : '+contentVersionId);
                    if(feed.RelatedRecordId == contentVersionId){
                        delete feed;
                    }
                }
            }
        }
        catch(DMLException e){
            System.debug('DML Exception pn deleteShareData'+e);
        }
        return deleteContentShare.ContentDocumentId;
    }
    
    /**
     *	To share Or Update ContentDocumentLink
     *  @param ids LinkedEntityIds for sharing 
     *  @param contentDocumentId
     *  @param shareType Viewer / collaborator
     *  @param contentVersionId
     *  @return object of contentIds
     */ 
    @AuraEnabled
    public static List<String> shareOrUpdateContent(List<Id> ids, id contentDocumentId, String shareType, id contentVersionId){
        List<String> contentIds = new List<String>();
        try{
             for (Id linkedEntityId : ids){
                List<ContentDocumentLink> existingBody = [SELECT Id FROM ContentDocumentLink WHERE LinkedEntityId =: linkedEntityId AND ContentDocumentId =: contentDocumentId];
                if(existingBody == null || existingBody.isEmpty()){
                    ContentDocumentLink contentDocumentLink = new ContentDocumentLink();
                    contentDocumentLink.LinkedEntityId = linkedEntityId;
                    contentDocumentLink.ShareType = (shareType == 'Viewer') ? 'V' : 'C';
                    contentDocumentLink.ContentDocumentId = contentDocumentId;
                    insert contentDocumentLink;
                    contentIds.add(contentDocumentLink.Id); 
                    String objectName = linkedEntityId.getSObjectType().getDescribe().getName();
                    if(objectName == 'CollaborationGroup' && contentVersionId != null){
                        Id feedId = FileListController.insertGroupFeed(linkedEntityId,contentVersionId);
                    }
                }else{
                    ContentDocumentLink updateExistingBody = existingBody.get(0);
                    updateExistingBody.ShareType = (shareType == 'Viewer') ? 'V' : 'C';
                    update updateExistingBody;
                }
             }
        }
        catch(DMLException e){
            System.debug('DML Exception on shareOrUpdateContent '+e);
        }
        return contentIds;
    }
    
     /**
     *	To insert the GroupFeed
     *  @params parentId,relatedRecordId
     *  @return ID of Feed
     */
    @AuraEnabled
    public static Id insertGroupFeed(Id parentId, Id relatedRecordId){
        FeedItem feed = new FeedItem();
        try{
            feed.ParentId = parentId;
            feed.RelatedRecordId = relatedRecordId;
            feed.Type = 'ContentPost';
            feed.Body = 'ContentPost';
            insert feed;
        }
        catch(DMLException e){
            System.debug('DML Exception on insertGroupFeed '+e);
        }
        return feed.Id;
    }
    
     /**
     *	To update the ExistingBody
     *  @params contentDocumentId,shareType, linkedEntityId
     *  @return ID of updatedExistingBody
     */
    @AuraEnabled
    public static Id updateOnChange(id contentDocumentId, String shareType, id linkedEntityId){
        List<ContentDocumentLink> contentDocuments = [SELECT Id, ShareType FROM ContentDocumentLink WHERE LinkedEntityId =: linkedEntityId AND ContentDocumentId =: contentDocumentId];
        System.debug('ContentDocuments : '+ contentDocuments);
        ContentDocumentLink updateExistingBody = new ContentDocumentLink();
        try{
            if(contentDocuments.size() > 0){
                updateExistingBody.Id  = contentDocuments.get(0).Id;
                updateExistingBody.ShareType = (shareType == 'Viewer') ? 'V' : (shareType == 'Collaborator') ? 'C' : 'I';
                System.debug('updateExistingBody : '+updateExistingBody);
                update updateExistingBody;
            }
        }
        catch(DMLException e){
            System.debug('DML Exception on updateOnChange'+e);
        }
        return updateExistingBody.Id;
    }
    
    /**
     *	To update the SharePrivacy
     *  @params contentVersionId
     *  @return SharingOption for particular contentVersionId
     */
    @AuraEnabled
    public static String updateSharePrivacy(id contentVersionId){
        List<ContentVersion> contentVersions = [SELECT Id, SharingOption, OwnerId FROM ContentVersion WHERE Id =: contentVersionId];
        ContentVersion contentVersion = new ContentVersion();
        try {
            if(contentVersions.size() > 0){
                id ownerId = FileListController.getUserId();
                contentVersion = contentVersions.get(0);
                contentVersion.Id = contentVersionId;
                System.debug('Content Version Update Share Privacy: '+contentVersion);
                if(contentVersion.OwnerId == ownerId){
                    contentVersion.SharingOption = (contentVersion.SharingOption == 'A') ? 'R' : 'A'; 
                }
                update contentVersion;
        	}
        }
        catch(DMLException e){
            System.debug('DML Exception on updateSharePrivacy'+e);
        }
        return contentVersion.SharingOption;  
    }
}