@isTest
public class ReusableLookupControllerTest {
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
            List<sObject> excludeItems = new List<sObject>();
            User userData = new User();
            userData.Id = UserInfo.getUserId();
            excludeItems.add(userData);
            //get search values of people with letter 'a'
            List <sObject> searchResult = ReusableLookupController.fetchLookUpValues('a', 'user', excludeItems);
            System.assertEquals(true, (searchResult.size() > 0), 'Contains user');
           
            //get search values of group with letter 'a'
            List <sObject> searchGroupResult = ReusableLookupController.fetchLookUpValues('a', 'collaborationgroup', excludeItems);
            test.stopTest();
        }
    }
    
}