global with sharing class FileListDesignController extends VisualEditor.DynamicPickList{
	/**
	 * To get the list of fields dynamically to the design system
	 */
    public static VisualEditor.DynamicPickListRows getDynamicPickListRows(){
        VisualEditor.DynamicPickListRows contentVersionFields = new VisualEditor.DynamicPickListRows();
        Map<String,Schema.SObjectField> fieldsMap = ContentVersion.sObjectType.getDescribe().fields.getMap(); 
		for(SObjectField field:fieldsMap.values()){
    		String name = field.getDescribe().getName();
            VisualEditor.DataRow fieldValue = new VisualEditor.DataRow(name, name);
            contentVersionFields.addRow(fieldValue);
 		}
        VisualEditor.DataRow fieldValue = new VisualEditor.DataRow('Owner.Name', 'Owner.Name');
        contentVersionFields.addRow(fieldValue);
        return contentVersionFields;
    }
    
    /**
	 * To get default value
	 */
    global override VisualEditor.DataRow getDefaultValue(){
        VisualEditor.DataRow defaultValue = new VisualEditor.DataRow('Title', 'Title');
        return defaultValue;
    }
    
    /**
	 * To get all values
	 */
    global override VisualEditor.DynamicPickListRows getValues() {
        return FileListDesignController.getDynamicPickListRows();
    }
    
}