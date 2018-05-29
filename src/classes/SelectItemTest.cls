@isTest
public class SelectItemTest {
    /**
     * A test method to set and get the values in the Select Item Class
     */ 
    public static testMethod void testController(){
        test.startTest();
        SelectItem selectItem = new SelectItem('test','test',false);
        String label = selectItem.label;
        System.assertEquals('test', label, 'Success');
        String value = selectItem.value;
        Boolean selected = selectItem.selected;
        SelectItem selectItemWithOutSelected = new SelectItem('test','test');
        label = selectItemWithOutSelected.label;
        System.assertEquals('test', label, 'Success');
        value = selectItemWithOutSelected.value;
        test.stopTest();
    }
}