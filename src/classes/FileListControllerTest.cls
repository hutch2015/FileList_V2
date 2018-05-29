@isTest
public class FileListControllerTest{
       
    public static testMethod void testController(){
        test.startTest();
            
        //Creating a test user to proceed the testing
        String uniqueUserName = 'standarduser' + DateTime.now().getTime() + '@testorg.testorg';
        
        Profile profileData = [SELECT Id FROM Profile WHERE Name='System Administrator'];
        User testUser = new User(Alias = 'standt', Email='standarduser@testorg.testorg',
            EmailEncodingKey='UTF-8', LastName='Testing', LanguageLocaleKey='en_US',
            LocaleSidKey='en_US', ProfileId = profileData.Id,
            TimeZoneSidKey='America/Los_Angeles',
             UserName=uniqueUserName);
		
        //Running as the test user
        System.runAs(testUser) {
            //Inserting data's for testing util and other functions            
            String namespace = FileListController.getNamespace();
            System.debug('NameSpace : '+ namespace);
            
            Account newAccount = new Account(Name='NewAccount');
            insert newAccount;
            
            Contract newContract = new Contract(AccountId=newAccount.Id);
            insert newContract;		
            
            Solution newSolution = new Solution(SolutionName='test solution');
            insert newSolution;
            
            Case newCase = new Case(Status ='New', Priority = 'Medium', Origin = 'Email'); 
            insert newCase;
            String caseId = newCase.Id;
            
            System.assert('New' == newCase.Status ); 
            ContentVersion newContentVersion = new ContentVersion();
            newContentVersion.Title = 'Title for this contentVersion';
            newContentVersion.PathOnClient = 'file_' + Datetime.now().getTime() + '.txt';
            newContentVersion.VersionData = Blob.valueOf('My Content in file_' + Datetime.now().getTime() + '.txt');
            newContentVersion.Origin = 'H';
            insert newContentVersion;
            
            ContentVersion contentVersionDocumentId = [SELECT Id, Title, ContentDocumentId FROM ContentVersion WHERE Id = :newContentVersion.Id LIMIT 1];
			System.debug('Content Version Document : '+contentVersionDocumentId);
            
            List<ContentDocument> documents = [SELECT Id, Title, LatestPublishedVersionId FROM ContentDocument];
            System.debug('Content Document : '+documents);
                       
            Id newContentDocumentId = documents.get(0).Id;
            System.debug('Content Document Id : '+newContentDocumentId);
            System.assert('Title for this contentVersion' == newContentVersion.Title );
            
            ContentDocumentLink newcontent = new ContentDocumentLink();
            newcontent.ContentDocumentId = contentVersionDocumentId.ContentDocumentId;
            newcontent.LinkedEntityId = caseId;
            newcontent.ShareType =  'v';
            insert newcontent;
            
            String contentVersionId = newContentVersion.Id;
            FeedItem elm = new FeedItem(Body = 'Post with related document body', ParentId = caseId, RelatedRecordId = contentVersionId, Type = 'ContentPost');
            insert elm;
            
            System.assert('Post with related document body' == elm.Body );
            
            ContentDocumentLink contentDocumentLink = [Select Id, ContentDocumentId, ContentDocument.LatestPublishedVersionId from ContentDocumentLink where LinkedEntityId =: caseId];
            String contentDocumentId = contentDocumentLink.ContentDocumentId;
            
            //For Covering some of the util functions
            FileListController.contentVersionQueryFields();
            FileListController.getUserSharePermissions();
            FileListDesignController.getDynamicPickListRows();
            String userId = FileListController.getUserId();
            List<String> getAttachmentsByString = FileListController.getAttachmentsByString(caseId);
            List<ContentVersion> attachments = FileListController.getAttachmentsById(caseId);
            List<id> attachmentsId = FileListController.getAttachments(caseId);
            List<ContentDocumentLink> userPermissions = FileListController.getUserSharePermissions();
            
            List<String> getUserIdAndPermission = FileListController.getUserIdAndPermission();
            ContentVersion attachmentByContentId = FileListController.getAttachmentByContentId(contentDocumentId);
            List<String> fields = FileListController.getFields();
            List<Object> fileData = FileListController.getFileAccessData(contentDocumentId);
            
            //Trying to get api name based on different objects
            List<String> objectDetails = FileListController.findObjectAPIName(caseId);
            List<String> solutionDetails = FileListController.findObjectAPIName(newSolution.Id);
            List<String> contractDetails = FileListController.findObjectAPIName(newContract.Id);
            List<String> accountDetails = FileListController.findObjectAPIName(newAccount.Id);        
            
            //Creating the records for testing the share content
            CollaborationGroup newCollaborationGroup = new CollaborationGroup(CollaborationType='Private', Name='New Group');
            insert newCollaborationGroup;
            System.debug('Content Version Feed Id : '+contentVersionId);
            
            FeedItem caseFeedItem = new FeedItem(Body = 'Post with related document body', ParentId=caseId, RelatedRecordId=contentVersionId, Type = 'ContentPost');
            insert caseFeedItem;
            
            FeedItem newFeedItem = new FeedItem(Body = 'Post with related document body', ParentId=newCollaborationGroup.Id, RelatedRecordId=contentVersionId, Type = 'ContentPost');
            insert newFeedItem;
            System.debug('Feed Item : '+newFeedItem);
            
            //Deleting a Share Data using case and collaborationGroup
            String deleteId = FileListController.deleteShareData(caseId, contentVersionId, contentDocumentId);
            String collaborationGroupId = FileListController.deleteShareData(newCollaborationGroup.Id, contentVersionId, contentDocumentId);
            List<id> ids = new List<id>();
            List<id> newIds = new List<id>();
            
            //Creating records to test shareOrUpdateContent
            Case anotherNewCase = new Case(Status ='New', Priority = 'Medium', Origin = 'Email'); 
            insert anotherNewCase;
            System.assert('New' == anotherNewCase.Status );
            
            id newCaseId = anotherNewCase.Id;
            newIds.add(userId);
            ids.add(newCaseId);
            ids.add(newCollaborationGroup.Id);
            
            //For Sharing or updating the content
            List<String> shareContentData = FileListController.shareOrUpdateContent(ids,contentDocumentId,'Viewer', contentVersionId);
            List<String> shareContent = FileListController.shareOrUpdateContent(newIds,contentDocumentId,'Collaborator',attachmentByContentId.Id);
            
            //For Inserting the feed
            Id feedId = FileListController.insertGroupFeed(caseId, attachmentByContentId.Id);
            Id catchFeedId = FileListController.insertGroupFeed(null, attachmentByContentId.Id);
            
            //Update the sharing content based on change 	viewer / collaborator
            Id updateShare = FileListController.updateOnChange(contentDocumentId, 'Viewer', newCase.Id);
            Id catchUpdateShare = FileListController.updateOnChange(contentDocumentId, 'Collaborator', newCase.Id);
            
            //For testing the sharing option function
            String shareOption = FileListController.updateSharePrivacy(newContentVersion.Id);
            String catchshareOption = FileListController.updateSharePrivacy(null);
            System.assertEquals(shareOption == 'A', false, 'Owner Id not matches');
            
            //Deleting the attachments
            ContentVersion deleteAttachment = FileListController.deleteAttachment(contentVersionDocumentId);
            ContentVersion nullContentVersion = new ContentVersion();
            ContentVersion catchDeleteAttachment = FileListController.deleteAttachment(nullContentVersion);
        }
        test.stopTest();
	}
}