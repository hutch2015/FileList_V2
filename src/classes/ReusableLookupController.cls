public with sharing class ReusableLookupController {
    /**
     * To fetch the lookup values for users based on the permission
     * @param searchKeyWord to search a user
     * @param objectName the object name in which you want to get users
     * @param ExcludeitemsList 
     * @return returns the sobject list
     */ 
    @AuraEnabled
    public static List < sObject > fetchLookUpValues(String searchKeyWord, String ObjectName, List<sObject> ExcludeitemsList) {
        String searchKey = '%' + searchKeyWord + '%';
        List < sObject > returnList = new List < sObject > ();
        
        //Excluding the already selected items
        List<string> listExcludeitems = new List<string>();
        for(sObject item : ExcludeitemsList ){
            listExcludeitems.add(item.id);
        }
        String sQuery;
        // Create a Dynamic SOQL Query For Fetch Record List with LIMIT 5 and exclude already selected records  
        if(ObjectName == 'user'){
            sQuery =  'select id, Name from ' +ObjectName + ' where UserPermissionsSFContentUser = true AND Name LIKE: searchKey AND Id NOT IN : listExcludeitems order by createdDate DESC limit 5';
        }else if(ObjectName == 'collaborationgroup'){
            sQuery =  'select id, Name from ' +ObjectName + ' where IsArchived=false AND IsAutoArchiveDisabled=true AND Name LIKE: searchKey AND Id NOT IN : listExcludeitems order by createdDate DESC limit 5';
        }        
        List < sObject > listOfRecords = Database.query(sQuery);
        
        for (sObject obj: listOfRecords) {
            returnList.add(obj);
        }
        return returnList;
    }
    
}