//Add Cheerio: Ресурсы - Библиотеки - 1ReeQ6WO8kKNxoaA_O0XEQ589cIrRvEBA9qcWpNqdOP17i47u6N9M5Xh0, последнюю версию и сохранить
var properties = PropertiesService.getScriptProperties();



function onOpen() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var entries = [{
    name : "Справка",
    functionName : "Help"
  },{
    name : "Получить все уровни и команды",
    functionName : "Get_Levels"
  },{
    name : "Скачать все уровни",
    functionName : "updateData9"
  },{
    name : "Сохранить все уровни",
    functionName : "Set_Levels"
  },{
    name : "Добавить уровни",
    functionName : "Create_Levels"
  },{
    name : "Удалить указанные уровни",
    functionName : "Remove_Levels"
  },{
    name : "Отправить все уровни",
    functionName : "Upload_Levels"
  } ,{
    name : "Отправить все бонусы",
    functionName : "Upload_Bonuses"
  },{
    name : "Отправить все секторы",
    functionName : "Upload_Sectors"
  },{
    name : "Отправить все подсказки",
    functionName : "Upload_Hints"
  },{
    name : "Отправить все комментарии",
    functionName : "Upload_Comments"
  },{
    name : "Отправить все задания",
    functionName : "Upload_Tasks"
  },{
    name : "Удалить бонусы из уровня",
    functionName : "Remove_Bonuses"
  },{
    name : "Удалить секторы из уровня",
    functionName : "Remove_Sectors"
  },{
    name : "Удалить подсказки из уровня",
    functionName : "Remove_Hints"
  },{
    name : "1.Скачать информацию для всех бонусов",
    functionName : "updateData"
  },{
    name : "2.Скачать все бонусы",
    functionName : "updateData2"
  },{
    name : "1.Скачать информацию для всех подсказок",
    functionName : "updateData5"
  },{
    name : "2.Скачать все подсказки",
    functionName : "updateData6"
  },{
    name : "1.Скачать информацию для всех заданий",
    functionName : "updateData7"
  },{
    name : "2.Скачать все задания",
    functionName : "updateData8"
  },{
    name : "Скачать все секторы",
    functionName : "updateData4"
  },{
    name : "Скачать все комментарии",
    functionName : "updateData3"
  },{
    name : "Редактор HTML",
    functionName : "previewCell"
  },{
    name : "Очистить очереди",
    functionName : "clearProperty"
  },{
    name : "1.Получить список участников",
    functionName : "getPlayers"
  },{
    name : "2.Отправить начисления",
    functionName : "submitBonusPenaltyTime"
  },{
    name : "2.Получить список начислений",
    functionName : "getBonusPenaltyTime"
  },{
    name : "2.Удалить помеченные бонусы",
    functionName : "deleteBonusPenaltyTime"
  }
  
  ];
  spreadsheet.addMenu("Encounter", entries);
};


function Upload_Bonuses() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Вы уверены?', ui.ButtonSet.YES_NO);
  if (response == ui.Button.YES) {
    
    var sheet_lvl =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
    var cells_lvl = sheet_lvl.getDataRange().getValues();
    if ((cells_lvl[0][1].toString().length > 0) & (cells_lvl[0][3].toString().length > 0) & (cells_lvl[0][5].toString().length > 0) & (cells_lvl[0][7].toString().length > 0)) {
      
      var login = cells_lvl[0][1].toString();
      var pass = cells_lvl[0][3].toString();
      var domain = cells_lvl[0][5].toString();
      var gameid = cells_lvl[0][7].toString();
      
      var sheet_bon =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Бонусы');
      var cells_bon = sheet_bon.getDataRange().getValues(); 
      
      
      for(var i=2; i< cells_bon.length; i++) 
      {
        
        if (cells_bon[i][0].toString().length > 0) { 
          //поехали собирать по столбцам
          var BonusName = cells_bon[i][1].toString();
          var BonusText = cells_bon[i][2].toString();
          var BonusHint = cells_bon[i][3].toString();
          var BonusLvlNum = cells_bon[i][4].toString();
          var BonusLvlId = cells_bon[i][5].toString();
          var BonusNumAnswer = cells_bon[i][6].toString();
          
          var BonusAbsTimeFrom = cells_bon[i][7].toString();
          var BonusAbsTimeTo = cells_bon[i][8].toString();
          
          var BonusDelayH = cells_bon[i][9].toString();
          var BonusDelayM = cells_bon[i][10].toString();
          var BonusDelayS = cells_bon[i][11].toString();
          
          var BonusWorkH = cells_bon[i][12].toString();
          var BonusWorkM = cells_bon[i][13].toString();
          var BonusWorkS = cells_bon[i][14].toString();
          
          var BonusH = cells_bon[i][15].toString();
          var BonusM = cells_bon[i][16].toString();
          var BonusS = cells_bon[i][17].toString();
          var BonusNegative = cells_bon[i][18].toString();
          var ddlBonusFor = cells_bon[i][30].toString();
          
          var payload = {
            'txtBonusName': BonusName,
            'txtTask': BonusText,
            'ddlBonusFor': "",
            'rbAllLevels': "1",
            'txtHelp': BonusHint,
            'ddlBonusFor':ddlBonusFor
          };
          
          payload['level_'+ BonusLvlId] = "on";
          for (var lvl = 1; lvl <= BonusNumAnswer; lvl++) {
            payload['answer_-'+ lvl] = cells_bon[i][lvl+18].toString();
          }
          
          payload['txtHours'] = BonusH;
          payload['txtMinutes'] = BonusM;
          payload['txtSeconds'] = BonusS;

          if (BonusNegative.length > 0) {
              payload['negative'] = "on";
          }
          
          
          if ((BonusAbsTimeFrom.length > 0) || (BonusAbsTimeTo.length > 0)){
          payload['chkAbsoluteLimit'] = "on";
          payload['txtValidFrom'] = BonusAbsTimeFrom;  
          payload['txtValidTo'] = BonusAbsTimeTo;
          }
          
          
          if ((BonusDelayH.length > 0) || (BonusDelayM.length > 0) || (BonusDelayS.length > 0) ){
            payload['chkDelay'] = "on";
            payload['txtDelayHours'] = BonusDelayH;
            payload['txtDelayMinutes'] = BonusDelayM;
            payload['txtDelaySeconds'] = BonusDelayS;
          }
          
          if ((BonusWorkH.length > 0) || (BonusWorkM.length > 0) || (BonusWorkS.length > 0) ){
            payload['chkRelativeLimit'] = "on";
            payload['txtValidHours'] = BonusWorkH;
            payload['txtValidMinutes'] = BonusWorkM;
            payload['txtValidSeconds'] = BonusWorkS;
          }
          
          
          
          
          
          auth(login,pass,domain); 
          var url = "https://"+ domain + "/Administration/Games/BonusEdit.aspx?gid=" + gameid +"&level=" + BonusLvlNum +"&bonus=0&action=save";  
          var headers = {
            'Cookie': CacheService.getUserCache().get('auth')
          };
          var params = {
            'headers': headers,
            'payload': payload,
            muteHttpExceptions: true
          };
          Logger.log(url);
          Logger.log(payload);
          var fetch =  UrlFetchApp.fetch(url, params);
          Logger.log(fetch.getAllHeaders());
          Logger.log(fetch.getResponseCode());
          Utilities.sleep(1200);
        }
        
      }
      
      
    }  
    else {
      Logger.log("Авторизационные данные не найдены");
    }
  } else {
    Logger.log('The user clicked "No" or the close button in the dialog\'s title bar.');
  }  
  
}


function Upload_Sectors() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Вы уверены?', ui.ButtonSet.YES_NO);
  if (response == ui.Button.YES) {
    
    var sheet_lvl =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
    var cells_lvl = sheet_lvl.getDataRange().getValues();
    if ((cells_lvl[0][1].toString().length > 0) & (cells_lvl[0][3].toString().length > 0) & (cells_lvl[0][5].toString().length > 0) & (cells_lvl[0][7].toString().length > 0)) {
      
      var login = cells_lvl[0][1].toString();
      var pass = cells_lvl[0][3].toString();
      var domain = cells_lvl[0][5].toString();
      var gameid = cells_lvl[0][7].toString();
      
      var sheet_sect =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Секторы');
      var cells_sect = sheet_sect.getDataRange().getValues(); 
      
      
      for(var i=2; i< cells_sect.length; i++) 
      {
        
        if (cells_sect[i][0].toString().length > 0) { 
          //поехали собирать по столбцам
          var SectName = cells_sect[i][1].toString();
          var SectLvlNum = cells_sect[i][2].toString();
          var SectLvlId = cells_sect[i][3].toString();
          var SectNumAnswer = cells_sect[i][4].toString();
          var forMemberID = cells_sect[i][16].toString();
          
          var payload = {
            'txtSectorName': SectName,
            'savesector': " "
          };
          
          for (var answ = 0; answ < SectNumAnswer; answ++) {
            payload['txtAnswer_'+ answ] = cells_sect[i][answ+5].toString();
            
            if (forMemberID.length > 0) {
              payload['ddlAnswerFor_'+ answ] = forMemberID;
            }
            else {
              payload['ddlAnswerFor_'+ answ] = "0";
            }
          }
                    
          
          auth(login,pass,domain); 
          var url = "https://"+ domain + "/Administration/Games/LevelEditor.aspx?gid=" + gameid +"&level=" + SectLvlNum;  
          var headers = {
            'Cookie': CacheService.getUserCache().get('auth')
          };
          var params = {
            'method'  : 'POST',
            'headers': headers,
            'payload': payload
          };
          Logger.log(url);
          Logger.log(payload);
          var fetch =  UrlFetchApp.fetch(url, params);
          Utilities.sleep(1200);
          //Logger.log(fetch.getAllHeaders());
          //Logger.log(fetch.getResponseCode());
          
        }
        
      }
      
      
    }  
    else {
      Logger.log("Авторизационные данные не найдены");
    }
  } else {
    Logger.log('The user clicked "No" or the close button in the dialog\'s title bar.');
  }  
  
}

function Upload_Hints() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Вы уверены?', ui.ButtonSet.YES_NO);
  if (response == ui.Button.YES) {
    
    var sheet_lvl =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
    var cells_lvl = sheet_lvl.getDataRange().getValues();
    if ((cells_lvl[0][1].toString().length > 0) & (cells_lvl[0][3].toString().length > 0) & (cells_lvl[0][5].toString().length > 0) & (cells_lvl[0][7].toString().length > 0)) {
      
      var login = cells_lvl[0][1].toString();
      var pass = cells_lvl[0][3].toString();
      var domain = cells_lvl[0][5].toString();
      var gameid = cells_lvl[0][7].toString();
      
      var sheet_hint =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Подсказки');
      var cells_hint = sheet_hint.getDataRange().getValues(); 
      
      
      for(var i=2; i< cells_hint.length; i++) 
      {
        
        if (cells_hint[i][0].toString().length > 0) { 
          //поехали собирать по столбцам
          var HintText = cells_hint[i][1].toString();
          var HintLvlNum = cells_hint[i][2].toString();
          var HintLvlId = cells_hint[i][3].toString();
          var HintD = cells_hint[i][4].toString();
          var HintH = cells_hint[i][5].toString();
          var HintM = cells_hint[i][6].toString();
          var HintS = cells_hint[i][7].toString();
          
          
          var chkRequestPenaltyConfirm = cells_hint[i][8].toString();
          

          var HintPenaltyH = cells_hint[i][9].toString();
          var HintPenaltyM = cells_hint[i][10].toString();
          var HintPenaltyS = cells_hint[i][11].toString();
          
          var txtPenaltyComment = cells_hint[i][12].toString();
          var ForMemberID = cells_hint[i][14].toString();
          
          
          
          
          
          var payload = {
            'NewPrompt': HintText,
            'NewPromptTimeoutDays': HintD,
            'NewPromptTimeoutHours': HintH,
            'NewPromptTimeoutMinutes': HintM,
            'NewPromptTimeoutSeconds': HintS
          };
          
          
          if ((HintPenaltyH.length > 0) || (HintPenaltyM.length > 0) || (HintPenaltyS.length > 0) ){

            payload['PenaltyPromptHours'] = HintPenaltyH;
            payload['PenaltyPromptMinutes'] = HintPenaltyM;
            payload['PenaltyPromptSeconds'] = HintPenaltyS;
            
          }
          
          if (ForMemberID.length > 0) {
            payload['ForMemberID'] = ForMemberID;
          }
          

          
          if (txtPenaltyComment.length > 0) { 
             payload['txtPenaltyComment'] = txtPenaltyComment;
          }
          
          if (chkRequestPenaltyConfirm.length > 0) { 
             payload['chkRequestPenaltyConfirm'] = "on";
            
          var url = "https://"+ domain + "/Administration/Games/PromptEdit.aspx?penalty=1&gid=" + gameid +"&level=" + HintLvlNum;    
          }
          
          else {
          var url = "https://"+ domain + "/Administration/Games/PromptEdit.aspx?gid=" + gameid +"&level=" + HintLvlNum;    
            
          }
          
          auth(login,pass,domain); 
          
          
          
          
          var headers = {
            'Cookie': CacheService.getUserCache().get('auth')
          };
          var params = {
            'method'  : 'POST',
            'headers': headers,
            'payload': payload
          };
          Logger.log(url);
          Logger.log(payload);
          var fetch =  UrlFetchApp.fetch(url, params);
          Utilities.sleep(1200);
          //Logger.log(fetch.getAllHeaders());
          //Logger.log(fetch.getResponseCode());
          
        }
        
      }
      
      
    }  
    else {
      Logger.log("Авторизационные данные не найдены");
    }
  } else {
    Logger.log('The user clicked "No" or the close button in the dialog\'s title bar.');
  }  
  
}


function Upload_Tasks() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Вы уверены?', ui.ButtonSet.YES_NO);
  if (response == ui.Button.YES) {
    
    var sheet_lvl =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
    var cells_lvl = sheet_lvl.getDataRange().getValues();
    if ((cells_lvl[0][1].toString().length > 0) & (cells_lvl[0][3].toString().length > 0) & (cells_lvl[0][5].toString().length > 0) & (cells_lvl[0][7].toString().length > 0)) {
      
      var login = cells_lvl[0][1].toString();
      var pass = cells_lvl[0][3].toString();
      var domain = cells_lvl[0][5].toString();
      var gameid = cells_lvl[0][7].toString();
      
      var sheet_task =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Задания');
      var cells_task = sheet_task.getDataRange().getValues(); 
      
      
      for(var i=1; i< cells_task.length; i++) 
      {
        
        if (cells_task[i][0].toString().length > 0) { 
          //поехали собирать по столбцам
          var TaskText = cells_task[i][1].toString();
          var TaskLvlNum = cells_task[i][2].toString();
          var TaskLvlId = cells_task[i][3].toString();
          var TaskHtml = cells_task[i][4].toString();
          var forMemberID = cells_task[i][6].toString();
          
          var payload = {
            'inputTask': TaskText,
            'forMemberID': forMemberID
          };
            
          if (TaskHtml.length > 0){
            payload['chkReplaceNlToBr'] = "on";
          }
          
          
          auth(login,pass,domain); 
          var url = "https://"+ domain + "/Administration/Games/TaskEdit.aspx?gid=" + gameid +"&level=" + TaskLvlNum;  
          var headers = {
            'Cookie': CacheService.getUserCache().get('auth')
          };
          var params = {
            'method'  : 'POST',
            'headers': headers,
            'payload': payload
          };
          Logger.log(url);
          Logger.log(payload);
          var fetch =  UrlFetchApp.fetch(url, params);
          Utilities.sleep(1200);
          //Logger.log(fetch.getAllHeaders());
          //Logger.log(fetch.getResponseCode());
          
        }
        
      }
      
      
    }  
    else {
      Logger.log("Авторизационные данные не найдены");
    }
  } else {
    Logger.log('The user clicked "No" or the close button in the dialog\'s title bar.');
  }  
  
}


function Upload_Comments() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Вы уверены?', ui.ButtonSet.YES_NO);
  if (response == ui.Button.YES) {
    
    var sheet_lvl =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
    var cells_lvl = sheet_lvl.getDataRange().getValues();
    if ((cells_lvl[0][1].toString().length > 0) & (cells_lvl[0][3].toString().length > 0) & (cells_lvl[0][5].toString().length > 0) & (cells_lvl[0][7].toString().length > 0)) {
      
      var login = cells_lvl[0][1].toString();
      var pass = cells_lvl[0][3].toString();
      var domain = cells_lvl[0][5].toString();
      var gameid = cells_lvl[0][7].toString();
      
      var sheet_task =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Комментарии');
      var cells_task = sheet_task.getDataRange().getValues(); 
      
      
      for(var i=1; i< cells_task.length; i++) 
      {
        
        if (cells_task[i][0].toString().length > 0) { 
          //поехали собирать по столбцам
          var CommText = cells_task[i][1].toString();
          var CommLvlNum = cells_task[i][2].toString();
          var CommLvlId = cells_task[i][3].toString();
         var CommLvlName = cells_task[i][4].toString();
          
          var payload = {
            'txtLevelComment': CommText,
            'txtLevelName':CommLvlName
          };
        
          auth(login,pass,domain); 
          var url = "https://"+ domain + "/Administration/Games/NameCommentEdit.aspx?gid=" + gameid +"&level=" + CommLvlNum;  
          var headers = {
            'Cookie': CacheService.getUserCache().get('auth')
          };
          var params = {
            'method'  : 'POST',
            'headers': headers,
            'payload': payload
          };
          console.log(url);
          //Logger.log(payload);
          var fetch =  UrlFetchApp.fetch(url, params);
          Utilities.sleep(1200);
          //Logger.log(fetch.getAllHeaders());
          //Logger.log(fetch.getResponseCode());
          
        }
        
      }
      
      
    }  
    else {
      Logger.log("Авторизационные данные не найдены");
    }
  } else {
    Logger.log('The user clicked "No" or the close button in the dialog\'s title bar.');
  }  
  
}






function Get_Levels() {
  
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();
  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0)) {
    
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();
    
    var url = "https://"+ domain + "/Administration/Games/LevelManager.aspx?gid=" + gameid;  
    
    auth(login,pass,domain); 
    var headers = {
      'Cookie': CacheService.getUserCache().get('auth')
    };
    var params = {
      'headers': headers,
      muteHttpExceptions: true
    };  
    var lvl = [];
    var fetch =  UrlFetchApp.fetch(url, params);
    
    
    const $ = Cheerio.load(fetch.getContentText());
    $('.textbox').each(function (index, element) {
      
      if ($(element).attr('value') != undefined) {
        
        var onelvl = [];
        onelvl[0] = $(element).attr('value');
        onelvl[1] = $(element).attr('name').substring(13, $(element).attr('name').length);
        lvl.push(onelvl);
      }
    });
    
    
    sheet.getRange(4, 1).setValue("Номер уровня");
    sheet.getRange(4, 2).setValue("Название");
    sheet.getRange(4, 3).setValue("ID уровня");
    sheet.getRange(4, 4).setValue("Удалить");
    
    var range = [];
    var data = sheet.getRange('A5:D100').getDisplayValues();
    
    data.forEach(function(tt, yy){
      Logger.log(tt[0]); 
      if (tt[0] > 0) {range.push("A" + (yy + 5));range.push("B" + (yy + 5));range.push("C" + (yy + 5));range.push("D" + (yy + 5))}
    });
    if (range.length > 0 ) {
      sheet.getRangeList(range).clearContent();
    }
    
    for (var lnum = 0; lnum < lvl.length; lnum++) {
      var row = lnum+5;
      var numlvl = lnum+1;
      
      sheet.getRange(row, 1).setValue(numlvl);
      sheet.getRange(row, 2).setValue(lvl[lnum][0]);
      sheet.getRange(row, 3).setValue(lvl[lnum][1]);
    }
    
    Get_Teams();
  }  
  else {
    Logger.log("Авторизационные данные не найдены");
  }
}


function Download_Levels(lvl,lvl_id) {
 console.info("Парсим уровень " + lvl + " lvl_id " + lvl_id);
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();

 
  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0)) {
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();

    if (CacheService.getUserCache().get('auth') == null) {
      auth(login,pass,domain); 
    }
    
    var headers = {
      'Cookie': CacheService.getUserCache().get('auth')
    };
    var params = {
      'headers': headers,
      muteHttpExceptions: true
    };  
  //console.info(headers);
  var sheet_comm =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Уровни');
  var row = sheet_comm.getLastRow() + 1;
    
  sheet_comm.getRange(row, 2).setValue(lvl);  
  sheet_comm.getRange(row, 4).setValue(lvl_id);   
  var url_bonus = "https://"+ domain + "/Administration/Games/LevelEditor.aspx?gid=" + gameid +"&level=" + lvl;  
  var fetch_bonus =  UrlFetchApp.fetch(url_bonus, params);
  const BQ = Cheerio.load(fetch_bonus.getContentText());
  
  BQ('a').each(function (ind, ele) {  
  
  if ((BQ(ele).attr('id') == "pnlSettings_lnkLevelNameEdit") && (BQ(ele).text() != undefined) && (BQ(ele).text() != "редактировать")) {  
   sheet_comm.getRange(row, 3).setValue(BQ(ele).text());
    }
  if ((BQ(ele).attr('id') == "lnkAdjustAutopass") && (BQ(ele).text() != undefined)) { 
    var Autopass_text = BQ(ele).text();
    
    if (Autopass_text.length > 4) {
    var Autopass = Autopass_text.split(", ");
      console.info(typeof Autopass[0] + " ...... " + typeof Autopass[1]);
    if (Autopass[0] !== undefined) {
    var Autopass_time_1 = Autopass[0].toString().split(/(\d+)+\s+([^0-9]+)+\s+(\d+)+\s+([^0-9]+)+\s+(\d+)+\s+([^0-9]+)/g);
      console.info("Autopass_time_1.length = " + Autopass_time_1.length);
      if ( Autopass_time_1.length > 6 ) {
       sheet_comm.getRange(row, 5).setValue(Autopass_time_1[1]); 
        sheet_comm.getRange(row, 6).setValue(Autopass_time_1[3]); 
        sheet_comm.getRange(row, 7).setValue(Autopass_time_1[5]);      
      }
      else {
      var Autopass_time_2 = Autopass[0].toString().split(/(\d+)+\s+([^0-9]+)+\s+(\d+)+\s+([^0-9]+)/g); 
      console.info("Autopass_time_2.length = " + Autopass_time_2.length);
      if ( Autopass_time_2.length > 4 ) {
       sheet_comm.getRange(row, 5).setValue(Autopass_time_2[1]); 
        sheet_comm.getRange(row, 6).setValue(Autopass_time_2[3]); 
        sheet_comm.getRange(row, 7).setValue("0");  
        
           
      }
      else {
      var Autopass_time_3 = Autopass[0].toString().split(/(\d+)+\s+([^0-9]+)/g);
      console.info("Autopass_time_3.length = " + Autopass_time_3.length);  
      if ( Autopass_time_3.length > 2 ) { 
        if ( /ча/i.test(Autopass_time_3[2]) == true ) {
        sheet_comm.getRange(row, 5).setValue(Autopass_time_3[1]); 
        sheet_comm.getRange(row, 6).setValue("0"); 
        sheet_comm.getRange(row, 7).setValue("0"); 
          
        }
        if ( /ми/i.test(Autopass_time_3[2]) == true ) {
         sheet_comm.getRange(row, 5).setValue("0"); 
          sheet_comm.getRange(row, 6).setValue(Autopass_time_3[1]); 
          sheet_comm.getRange(row, 7).setValue("0"); 
        }
        
        if ( /се/i.test(Autopass_time_3[2]) == true ) {
          sheet_comm.getRange(row, 5).setValue("0"); 
          sheet_comm.getRange(row, 6).setValue("0"); 
          sheet_comm.getRange(row, 7).setValue(Autopass_time_3[1]); 
          
        }

          
      }   
      }  
      } 
      
     
    }
      else {
        
        sheet_comm.getRange(row, 5).setValue("0"); 
     sheet_comm.getRange(row, 6).setValue("0"); 
     sheet_comm.getRange(row, 7).setValue("0");
        
      }
    
      
      if (Autopass[1] !== undefined) {
    var Autopass_time_1 = Autopass[1].toString().split(/(\d+)+\s+([^0-9]+)+\s+(\d+)+\s+([^0-9]+)+\s+(\d+)+\s+([^0-9]+)/g);
      console.info("Autopass_time_1.length = " + Autopass_time_1.length);
      if ( Autopass_time_1.length > 6 ) {
       sheet_comm.getRange(row, 9).setValue(Autopass_time_1[1]); 
        sheet_comm.getRange(row, 10).setValue(Autopass_time_1[3]); 
        sheet_comm.getRange(row, 11).setValue(Autopass_time_1[5]);      
      }
      else {
      var Autopass_time_2 = Autopass[1].toString().split(/(\d+)+\s+([^0-9]+)+\s+(\d+)+\s+([^0-9]+)/g); 
      console.info("Autopass_time_2.length = " + Autopass_time_2.length);
      if ( Autopass_time_2.length > 4 ) {
       sheet_comm.getRange(row, 9).setValue(Autopass_time_2[1]); 
        sheet_comm.getRange(row, 10).setValue(Autopass_time_2[3]); 
        sheet_comm.getRange(row, 11).setValue("0");  
        
           
      }
      else {
      var Autopass_time_3 = Autopass[1].toString().split(/(\d+)+\s+([^0-9]+)/g);
      console.info("Autopass_time_3.length = " + Autopass_time_3.length);  
      if ( Autopass_time_3.length > 2 ) { 
        if ( /ча/i.test(Autopass_time_3[2]) == true ) {
        sheet_comm.getRange(row, 9).setValue(Autopass_time_3[1]); 
        sheet_comm.getRange(row, 10).setValue("0"); 
        sheet_comm.getRange(row, 11).setValue("0"); 
          
        }
        if ( /ми/i.test(Autopass_time_3[2]) == true ) {
         sheet_comm.getRange(row, 9).setValue("0"); 
          sheet_comm.getRange(row, 10).setValue(Autopass_time_3[1]); 
          sheet_comm.getRange(row, 11).setValue("0"); 
        }
        
        if ( /се/i.test(Autopass_time_3[2]) == true ) {
          sheet_comm.getRange(row, 9).setValue("0"); 
          sheet_comm.getRange(row, 10).setValue("0"); 
          sheet_comm.getRange(row, 11).setValue(Autopass_time_3[1]); 
          
        }

          
      }   
      }  
      } 
      sheet_comm.getRange(row, 8).setValue("Да"); 
    }
           else {
        
      sheet_comm.getRange(row, 9).setValue("0"); 
     sheet_comm.getRange(row, 10).setValue("0"); 
     sheet_comm.getRange(row, 11).setValue("0");
        
      }
      
      
      
    }
    else {
     sheet_comm.getRange(row, 5).setValue("0"); 
     sheet_comm.getRange(row, 6).setValue("0"); 
     sheet_comm.getRange(row, 7).setValue("0"); 
     sheet_comm.getRange(row, 9).setValue("0"); 
     sheet_comm.getRange(row, 10).setValue("0"); 
     sheet_comm.getRange(row, 11).setValue("0");
    }
    }  
  });
    

   BQ('input').each(function (ind, ele) {
    if ((BQ(ele).attr('name') == "txtApHours" ) && (BQ(ele).attr('value') != undefined)) {
      sheet_comm.getRange(row, 5).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "txtApMinutes" ) && (BQ(ele).attr('value') != undefined)) {
      sheet_comm.getRange(row, 6).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "txtApSeconds" ) && (BQ(ele).attr('value') != undefined)) {
      sheet_comm.getRange(row, 7).setValue(BQ(ele).attr('value'));
    }
     
    if ((BQ(ele).attr('name') == "chkTimeoutPenalty" ) && (BQ(ele).attr('checked') != undefined)) {
      sheet_comm.getRange(row, 8).setValue("Да");
    }
     
    if ((BQ(ele).attr('name') == "txtApPenaltyHours" ) && (BQ(ele).attr('disabled') != "disabled")) {
      sheet_comm.getRange(row, 9).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "txtApPenaltyMinutes" ) && (BQ(ele).attr('disabled') != "disabled")) {
      sheet_comm.getRange(row, 10).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "txtApPenaltySeconds" ) && (BQ(ele).attr('disabled') != "disabled")) {
      sheet_comm.getRange(row, 11).setValue(BQ(ele).attr('value'));
    } 

    if ((BQ(ele).attr('name') == "txtAttemptsNumber" ) && (BQ(ele).attr('value') != undefined)) {
      sheet_comm.getRange(row, 12).setValue(BQ(ele).attr('value'));
    }   
     
   if ((BQ(ele).attr('name') == "txtAttemptsPeriodHours" ) && (BQ(ele).attr('value') != undefined)) {
      sheet_comm.getRange(row, 13).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "txtAttemptsPeriodMinutes" ) && (BQ(ele).attr('value') != undefined)) {
      sheet_comm.getRange(row,14).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "txtAttemptsPeriodSeconds" ) && (BQ(ele).attr('value') != undefined)) {
      sheet_comm.getRange(row, 15).setValue(BQ(ele).attr('value'));
    }
     
     if ((BQ(ele).attr('name') == "rbApplyForPlayer" ) && (BQ(ele).attr('checked') != undefined)) {
      sheet_comm.getRange(row, 16).setValue(BQ(ele).attr('value'));
    }


  });
  
/*
  BQ('textarea').each(function (ind, ele) {
    if (BQ(ele).attr('name') == "txtTask" ) {
      sheet_bon.getRange(row, 3).setValue(BQ(ele).text());
    }
    if (BQ(ele).attr('name') == "txtHelp" ) {
      sheet_bon.getRange(row, 4).setValue(BQ(ele).text());
    }
  });
    
*/
  
  

  } 
  else {
    Logger.log("Авторизационные данные не найдены");
  }    
  
}










function Upload_Levels() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Вы уверены?', ui.ButtonSet.YES_NO);
  if (response == ui.Button.YES) {
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();
  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0)) {
    
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();
    
    
    
      var sheet_task =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Уровни');
      var cells_task = sheet_task.getDataRange().getValues(); 
      
      for(var i=2; i< cells_task.length; i++) 
      {
        
        if (cells_task[i][0].toString().length > 0) { 
          //поехали собирать по столбцам
          var LvlNum = cells_task[i][1].toString();
          var LevName = cells_task[i][2].toString();
          var LvlId = cells_task[i][3].toString();
          
          var txtApHours = cells_task[i][4].toString();
          var txtApMinutes = cells_task[i][5].toString();
          var txtApSeconds = cells_task[i][6].toString();
          
          var chkTimeoutPenalty = cells_task[i][7].toString();
          
          var txtApPenaltyHours = cells_task[i][8].toString();
          var txtApPenaltyMinutes = cells_task[i][9].toString();
          var txtApPenaltySeconds = cells_task[i][10].toString();
          
          var txtAttemptsNumber = cells_task[i][11].toString();

          var txtAttemptsPeriodHours = cells_task[i][12].toString();
          var txtAttemptsPeriodMinutes = cells_task[i][13].toString();
          var txtAttemptsPeriodSeconds = cells_task[i][14].toString();
          
          var rbApplyForPlayer = cells_task[i][15].toString();
          
          
  
           var payload = {  
           'txtAttemptsNumber': txtAttemptsNumber,
            'txtAttemptsPeriodHours': txtAttemptsPeriodHours,
            'txtAttemptsPeriodMinutes': txtAttemptsPeriodMinutes,
            'txtAttemptsPeriodSeconds': txtAttemptsPeriodSeconds,
            'rbApplyForPlayer': rbApplyForPlayer, 
            'action': 'upansblock'
           }
          auth(login,pass,domain); 
          var url = "https://"+ domain + "/Administration/Games/LevelEditor.aspx?gid=" + gameid +"&level=" + LvlNum;  
          var headers = {
            'Cookie': CacheService.getUserCache().get('auth')
          };
          var params = {
            'method'  : 'POST',
            'headers': headers,
            'payload': payload
          };
          Logger.log(url);
          Logger.log(payload);
          var fetch =  UrlFetchApp.fetch(url, params);
            

          

          
          var payload = {
            'txtApHours': txtApHours,
            'txtApMinutes': txtApMinutes,
            'txtApSeconds': txtApSeconds,
            'txtApPenaltyHours': txtApPenaltyHours,
            'txtApPenaltyMinutes': txtApPenaltyMinutes,
            'txtApPenaltySeconds':txtApPenaltySeconds,
            'updateautopass': ' '
          };
            
          if (chkTimeoutPenalty.length > 0){
            payload['chkTimeoutPenalty'] = "on";
          }
          
          auth(login,pass,domain); 
          var url = "https://"+ domain + "/Administration/Games/LevelEditor.aspx?gid=" + gameid +"&level=" + LvlNum;  
          var headers = {
            'Cookie': CacheService.getUserCache().get('auth')
          };
          var params = {
            'method'  : 'POST',
            'headers': headers,
            'payload': payload
          };
          Logger.log(url);
          Logger.log(payload);
          var fetch =  UrlFetchApp.fetch(url, params);
          Logger.log(fetch.getAllHeaders());
          Logger.log(fetch.getResponseCode());
          Utilities.sleep(1200);         
        }
        
      }
    
  }  
  else {
    Logger.log("Авторизационные данные не найдены");
  }
    } else {
    Logger.log('The user clicked "No" or the close button in the dialog\'s title bar.');
  } 
}




function Set_Levels() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Вы уверены?', ui.ButtonSet.YES_NO);
  if (response == ui.Button.YES) {
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();
  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0)) {
    
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();
    
    var payload = {};
    var range = [];
    var data = sheet.getRange('A5:D300').getDisplayValues();
    
    data.forEach(function(tt, yy){
      if (tt[2] > 0) {
        if (tt[1].length == 0 ) {
        payload['txtLevelName_'+ tt[2]] = " ";  
        }
        else {
        payload['txtLevelName_'+ tt[2]] = tt[1].toString();  
        }
        
      }
    });
    
    Logger.log(payload);
    
    var url = "https://"+ domain + "/Administration/Games/LevelManager.aspx?gid=" + gameid +"&level_names=update";  
    
    auth(login,pass,domain); 
    var headers = {
      'Cookie': CacheService.getUserCache().get('auth')
    };
    var params = {
      'method'  : 'POST',
      'headers': headers,
      'payload': payload,
      muteHttpExceptions: true
    };  

    var fetch =  UrlFetchApp.fetch(url, params);
    
    

  }  
  else {
    Logger.log("Авторизационные данные не найдены");
  }
    } else {
    Logger.log('The user clicked "No" or the close button in the dialog\'s title bar.');
  } 
}



function Create_Levels() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt('Введите количество уровней', ui.ButtonSet.YES_NO);
  var button = result.getSelectedButton();
  var num = parseInt(result.getResponseText());
  if (button == ui.Button.YES) {
  
  if (num > 0 ) {  
    
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();
  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0)) {
    
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();
    
    
    var url = "https://"+ domain + "/Administration/Games/LevelManager.aspx?gid=" + gameid +"&levels=create&ddlCreateLevelsNum="+num;  
    
    auth(login,pass,domain); 
    var headers = {
      'Cookie': CacheService.getUserCache().get('auth')
    };
    var params = {
      'headers': headers,
      muteHttpExceptions: true
    };  

    var fetch =  UrlFetchApp.fetch(url, params);
    
    Get_Levels();

  }  
  else {
    Logger.log("Авторизационные данные не найдены");
  }
  }  
  } else {
    Logger.log('The user clicked "No" or the close button in the dialog\'s title bar.');
  } 
}


function Remove_Levels() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Вы уверены?', ui.ButtonSet.YES_NO);
  if (response == ui.Button.YES) {
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();
  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0)) {
    
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();
      
    
    auth(login,pass,domain); 
    var headers = {
      'Cookie': CacheService.getUserCache().get('auth')
    };
    var params = {
      'headers': headers,
      muteHttpExceptions: true
    };  

    
   var data = sheet.getRange('A5:D100').getDisplayValues().reverse();
    data.forEach(function(tt, yy){
      if (tt[2] > 0) {
        if (tt[3].toString().length > 0) {
          var url = "https://"+ domain + "/Administration/Games/LevelManager.aspx?gid=" + gameid +"&levels=delete&ddlDeleteLevels="+tt[0];  
          var fetch =  UrlFetchApp.fetch(url, params);
          Utilities.sleep(1200);
        }        
      }
    });
    
    Get_Levels();
  }  
  else {
    Logger.log("Авторизационные данные не найдены");
  }
  } else {
    Logger.log('The user clicked "No" or the close button in the dialog\'s title bar.');
  } 
}





function Remove_Bonuses() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Вы уверены?', ui.ButtonSet.YES_NO);
  if (response == ui.Button.YES) { 
    var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
    var cells = sheet.getDataRange().getValues();
    if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0) & (cells[0][9].toString().length > 0)) {
      
      var login = cells[0][1].toString();
      var pass = cells[0][3].toString();
      var domain = cells[0][5].toString();
      var gameid = cells[0][7].toString();
      var lvl = cells[0][9].toString();
      
      
      var url = "https://"+ domain + "/Administration/Games/LevelEditor.aspx?level="+lvl+"&gid=" + gameid;  
      
      auth(login,pass,domain); 
      var headers = {
        'Cookie': CacheService.getUserCache().get('auth')
      };
      var params = {
        'headers': headers,
        muteHttpExceptions: true
      };  
      
      var fetch =  UrlFetchApp.fetch(url, params);
      
      const $ = Cheerio.load(fetch.getContentText());
      $('table.bg_dark > tbody > tr > td > table > tbody > tr > td > a').each(function (index, element) {
        if ($(element).attr('href').indexOf('bonus=') > 0 ) {
          var bonus_id = $(element).attr('href').split('bonus=')[1].split('&action')[0];
          var url1 = "https://"+ domain + "/Administration/Games/BonusEdit.aspx?gid=" + gameid +"&level=" + lvl +"&bonus="+bonus_id+"&action=delete";  
          var fetch =  UrlFetchApp.fetch(url1, params);
          Utilities.sleep(1200);
          Logger.log(fetch.getAllHeaders());
          Logger.log(fetch.getResponseCode());
        }
      });
      
      
    }  
    else {
      Logger.log("Авторизационные данные не найдены");
    }
  } else {
    Logger.log('The user clicked "No" or the close button in the dialog\'s title bar.');
  }  
}











function Remove_Hints() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Вы уверены?', ui.ButtonSet.YES_NO);
  if (response == ui.Button.YES) { 
    var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
    var cells = sheet.getDataRange().getValues();
    if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0) & (cells[0][9].toString().length > 0)) {
      
      var login = cells[0][1].toString();
      var pass = cells[0][3].toString();
      var domain = cells[0][5].toString();
      var gameid = cells[0][7].toString();
      var lvl = cells[0][9].toString();
      
      
      var url = "https://"+ domain + "/Administration/Games/LevelEditor.aspx?level="+lvl+"&gid=" + gameid;  
      
      auth(login,pass,domain); 
      var headers = {
        'Cookie': CacheService.getUserCache().get('auth')
      };
      var params = {
        'headers': headers,
        muteHttpExceptions: true
      };  
      
      var fetch =  UrlFetchApp.fetch(url, params);
      
      const $ = Cheerio.load(fetch.getContentText());
      $('table.bg_dark > tbody > tr > td > table > tbody > tr > td > a').each(function (index, element) {
        if ($(element).attr('href').indexOf('prid=') > 0 ) {
          var hint_id = $(element).attr('href').split('prid=')[1].split('\',')[0];
          Logger.log(hint_id);
          var url1 = "https://"+ domain + "/Administration/Games/PromptEdit.aspx?gid=" + gameid +"&level=" + lvl +"&prid="+hint_id+"&action=PromptDelete";  
          var fetch =  UrlFetchApp.fetch(url1, params);
          Utilities.sleep(1200);
          Logger.log(fetch.getAllHeaders());
          Logger.log(fetch.getResponseCode());
        }
      });
      
      
    }  
    else {
      Logger.log("Авторизационные данные не найдены");
    }
  } else {
    Logger.log('The user clicked "No" or the close button in the dialog\'s title bar.');
  }  
}


function Remove_Sectors() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert('Вы уверены?', ui.ButtonSet.YES_NO);
  if (response == ui.Button.YES) { 
    var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
    var cells = sheet.getDataRange().getValues();
    if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0) & (cells[0][9].toString().length > 0)) {
      
      var login = cells[0][1].toString();
      var pass = cells[0][3].toString();
      var domain = cells[0][5].toString();
      var gameid = cells[0][7].toString();
      var lvl = cells[0][9].toString();
      
      
      var url = "https://"+ domain + "/Administration/Games/LevelEditor.aspx?level="+lvl+"&gid=" + gameid+"&swanswers=1";  
      
      auth(login,pass,domain); 
      var headers = {
        'Cookie': CacheService.getUserCache().get('auth')
      };
      var params = {
        'headers': headers,
        muteHttpExceptions: true
      };  
      
      var fetch =  UrlFetchApp.fetch(url, params);
      const $ = Cheerio.load(fetch.getContentText());
      $('div.cb > form.noPadMarg > div').each(function (index, element) {
        if ($(element).attr('id').indexOf('SectorEdit') > 0 ) {       
          var sector_id = $(element).attr('id').split('_')[1];
          var url1 = "https://"+ domain + "/Administration/Games/LevelEditor.aspx?gid=" + gameid +"&level=" + lvl +"&swanswers=1&delsector="+sector_id;  
          Logger.log(url1);
          var fetch =  UrlFetchApp.fetch(url1, params);
          Utilities.sleep(1200);
          //Logger.log(fetch.getAllHeaders());
          //Logger.log(fetch.getResponseCode());
        }
      });
      
      
    }  
    else {
      Logger.log("Авторизационные данные не найдены");
    }
  } else {
    Logger.log('The user clicked "No" or the close button in the dialog\'s title bar.');
  }  
}




function Get_Teams() {
  
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();
  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0)) {
    
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();
    var lvl = cells[4][0].toString();

    auth(login,pass,domain); 
    var headers = {
      'Cookie': CacheService.getUserCache().get('auth')
    };
    var params = {
      'headers': headers,
      muteHttpExceptions: true
    };  

    sheet.getRange(4, 6).setValue("Команда");
    sheet.getRange(4, 7).setValue("ID команды");
    
    var range = [];
    var data = sheet.getRange('F5:G100').getDisplayValues();
    
    data.forEach(function(tt, yy){
      if (tt[1] > 0) {range.push("F" + (yy + 5));range.push("G" + (yy + 5));}
    });
    if (range.length > 0 ) {
      sheet.getRangeList(range).clearContent();
    }
    
    var teams = [];
    if (lvl.length > 0 ) {
    var url = "https://"+ domain + "/Administration/Games/TaskEdit.aspx?gid=" + gameid + "&level=" + lvl;  
    var fetch =  UrlFetchApp.fetch(url, params);
    const $ = Cheerio.load(fetch.getContentText());
    $('select#forMemberID > option').each(function (index, element) {
      if ($(element).attr('value') != undefined) {
        var oneteam = [];
        oneteam[0] = $(element).attr('value');
        oneteam[1] = $(element).text();
        teams.push(oneteam);
      }
    });
      
      
    for (var tnum = 0; tnum < teams.length; tnum++) {
      var row = tnum+5;
      sheet.getRange(row, 6).setValue(teams[tnum][1]);
      sheet.getRange(row, 7).setValue(teams[tnum][0]);
    }  
 
      
      
    }
      
    
    
  }  
  else {
    Logger.log("Авторизационные данные не найдены");
  }
}





function Download_Bonuses(lvl) {
  console.info("Парсим уровень " + lvl);
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();
  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0) & (cells[0][9].toString().length > 0)) {
    
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();
    auth(login,pass,domain); 
    var headers = {
      'Cookie': CacheService.getUserCache().get('auth')
    };
    var params = {
      'headers': headers,
      muteHttpExceptions: true
    };  
    var bon_num = 1;
    
    var ss = SpreadsheetApp.getActive();
    var sheet_tmp = ss.getSheetByName('tmp');
    sheet_tmp.getRange(1, 1).setValue("lvl");
    sheet_tmp.getRange(1, 2).setValue("bonus_id");
    
    
    var url = "https://"+ domain + "/Administration/Games/LevelEditor.aspx?level="+lvl+"&gid=" + gameid;
    var fetch =  UrlFetchApp.fetch(url, params);
    const $ = Cheerio.load(fetch.getContentText());
    //$('table.bg_dark > tbody > tr > td > table > tbody > tr > td > a').each(function (index, element) {
    //  if ($(element).attr('href').indexOf('bonus=') > 0 ) {
    //    var bonus_id = $(element).attr('href').split('bonus=')[1].split('&action')[0];  
     $('.bonus_lnk', '#bonuses').each(function (index, element) {
        var bonus_id = $(element).attr('data-bonusid');
        if (bonus_id){
          var row = sheet_tmp.getLastRow() + 1;
          sheet_tmp.getRange(row, 1).setValue(lvl);
          sheet_tmp.getRange(row, 2).setValue(bonus_id);
      }
    });
    Utilities.sleep(1100);    
    
  }  
  else {
    Logger.log("Авторизационные данные не найдены");
  } 
}

function Download_Bonus(lvl,bonus_id) {
  console.info("Парсим бонус c id = "+ bonus_id + " уровня " + lvl);
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();
  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0) & (cells[0][9].toString().length > 0)) {
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();
    
    if (CacheService.getUserCache().get('auth') == null) {
      auth(login,pass,domain); 
    }
    
    var headers = {
      'Cookie': CacheService.getUserCache().get('auth')
    };
    var params = {
      'headers': headers,
      muteHttpExceptions: true
    };  
  //console.info(headers);
  var sheet_bon =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Бонусы');
  var row = sheet_bon.getLastRow() + 1;
  var answer_cell = 20;
  var url_bonus = "https://"+ domain + "/Administration/Games/BonusEdit.aspx?gid=" + gameid +"&level=" + lvl +"&bonus="+bonus_id+"&action=edit";  
  var fetch_bonus =  UrlFetchApp.fetch(url_bonus, params);
  const BQ = Cheerio.load(fetch_bonus.getContentText());
  sheet_bon.getRange(row, 30).setValue(BQ('#ddlBonusFor > option:selected').attr('value'));  
  sheet_bon.getRange(row, 5).setValue("=INDEX(lvl_num;MATCH(F"+(row)+";lvl_id;0);1)");
  sheet_bon.getRange(row, 7).setValue("=COUNTA(T"+(row)+":AB"+(row)+")");
  BQ('input').each(function (ind, ele) {
    if ((BQ(ele).attr('name') == "txtBonusName") && (BQ(ele).attr('value') != undefined)) {
      sheet_bon.getRange(row, 2).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name').indexOf('nswer_') >= 0 ) && (BQ(ele).attr('value') != undefined))  {
      sheet_bon.getRange(row, answer_cell++).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name').indexOf('level_') >= 0 ) && (BQ(ele).attr('checked') == "checked"))  {
      sheet_bon.getRange(row, 6).setValue(BQ(ele).attr('name').substring(6, BQ(ele).attr('name').length));
    }
    if ((BQ(ele).attr('name') == "txtValidFrom" ) && (BQ(ele).attr('disabled') != "disabled")) {
      sheet_bon.getRange(row, 8).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "txtValidTo" ) && (BQ(ele).attr('disabled') != "disabled")) {
      sheet_bon.getRange(row, 9).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "txtDelayHours" ) && (BQ(ele).attr('disabled') != "disabled")) {
      sheet_bon.getRange(row, 10).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "txtDelayMinutes" ) && (BQ(ele).attr('disabled') != "disabled")) {
      sheet_bon.getRange(row, 11).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "txtDelaySeconds" ) && (BQ(ele).attr('disabled') != "disabled")) {
      sheet_bon.getRange(row, 12).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "txtValidHours" ) && (BQ(ele).attr('disabled') != "disabled")) {
      sheet_bon.getRange(row, 13).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "txtValidMinutes" ) && (BQ(ele).attr('disabled') != "disabled")) {
      sheet_bon.getRange(row, 14).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "txtValidSeconds" ) && (BQ(ele).attr('disabled') != "disabled")) {
      sheet_bon.getRange(row, 15).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "txtHours" ) && (BQ(ele).attr('disabled') != "disabled")) {
      sheet_bon.getRange(row, 16).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "txtMinutes" ) && (BQ(ele).attr('disabled') != "disabled")) {
      sheet_bon.getRange(row, 17).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "txtSeconds" ) && (BQ(ele).attr('disabled') != "disabled")) {
      sheet_bon.getRange(row, 18).setValue(BQ(ele).attr('value'));
    }
    //if ((BQ(ele).attr('name') == "negative" ) && (BQ(ele).attr('disabled') != "disabled")) {
    //  sheet_bon.getRange(row, 19).setValue(BQ(ele).attr('value'));
    //}
    if (BQ(ele).attr('name') === "negative" && BQ(ele).prop('checked')) {
      sheet_bon.getRange(row, 19).setValue('on'); 
    }
  });
  

  BQ('textarea').each(function (ind, ele) {
    if (BQ(ele).attr('name') == "txtTask" ) {
      sheet_bon.getRange(row, 3).setValue(BQ(ele).text());
    }
    if (BQ(ele).attr('name') == "txtHelp" ) {
      sheet_bon.getRange(row, 4).setValue(BQ(ele).text());
    }
  });
  
  
  }  
  else {
    Logger.log("Авторизационные данные не найдены");
  } 
}

function Download_Sectors(lvl) {
  console.info("Парсим секторы уровня " + lvl);
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();
  
 
  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0)) {
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();
    
    
    
    
    if (CacheService.getUserCache().get('auth') == null) {
      auth(login,pass,domain); 
    }
    
    var headers = {
      'Cookie': CacheService.getUserCache().get('auth')
    };
    var params = {
      'headers': headers,
      muteHttpExceptions: true
    };  
  //console.info(headers);
  var sheet_sec =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Секторы');
  var url_sec = "https://"+ domain + "/ALoader/LevelInfo.aspx?gid=" + gameid +"&level=" + lvl + "&object=3";  
  var fetch_sec =  UrlFetchApp.fetch(url_sec, params);
  const SQ = Cheerio.load(fetch_sec.getContentText());
  //console.info(SQ('option').length);
    if ( SQ('option').length > 0 ) { 
      SQ('option').each(function (ind, ele) {
        var answ = 6;
        var row = sheet_sec.getLastRow() + 1;    
        sheet_sec.getRange(row, 3).setValue(lvl);    
        sheet_sec.getRange(row, 4).setValue("=INDEX(lvl_id;MATCH(C"+(row)+";lvl_num;0);1)");
        sheet_sec.getRange(row, 5).setValue("=COUNTA(F"+(row)+":O"+(row)+")");   
        sheet_sec.getRange(row, 2).setValue(SQ(ele).text());   
        var url_sec_answ = "https://"+ domain + "/ALoader/LevelInfo.aspx?gid=" + gameid +"&level=" + lvl + "&object=3&sector="+ SQ(ele).attr('value');  
        var fetch_sec_answ =  UrlFetchApp.fetch(url_sec_answ, params);
        const AQ = Cheerio.load(fetch_sec_answ.getContentText());  
        
        AQ('input').each(function (inda, elea) {  
          if ((AQ(elea).attr('name').indexOf('txtAnswer') >= 0) && (AQ(elea).attr('value') != undefined)) {
            sheet_sec.getRange(row, answ++).setValue(AQ(elea).attr('value'));
          } 
        }); 
        
        
        
        
        
      });
    } 
    else {
       var row = sheet_sec.getLastRow() + 1;    
      sheet_sec.getRange(row, 3).setValue(lvl);    
      sheet_sec.getRange(row, 4).setValue("=INDEX(lvl_id;MATCH(C"+(row)+";lvl_num;0);1)");
      sheet_sec.getRange(row, 5).setValue("=COUNTA(F"+(row)+":O"+(row)+")");    
      
      
      var url_sec_answ = "https://"+ domain + "/ALoader/LevelInfo.aspx?gid=" + gameid +"&level=" + lvl + "&object=2";  
      var fetch_sec_answ =  UrlFetchApp.fetch(url_sec_answ, params);
      const AQ = Cheerio.load(fetch_sec_answ.getContentText()); 
      AQ('form > div').each(function (inda, elea) { 
      if  ( (AQ(elea).attr('id') !== undefined) && (AQ(elea).attr('id').indexOf('AnswersEdit') >= 0)) {
      var answNum = AQ(elea).attr('id').substring(15, AQ(elea).attr('name'));
      var answ = 6;
      var url_sec_answ_val = "https://"+ domain + "/ALoader/LevelInfo.aspx?gid=" + gameid +"&level=" + lvl + "&object=2&editanswers=" + answNum;  
      var fetch_sec_answ_val =  UrlFetchApp.fetch(url_sec_answ_val, params);
      const AvQ = Cheerio.load(fetch_sec_answ_val.getContentText());   
      AvQ('input').each(function (indar, elear) {  
        console.log(AvQ(elear).attr('name'));
          if ((AvQ(elear).attr('name') !== undefined) && (AvQ(elear).attr('name').indexOf('txtAnswer') >= 0) && (AvQ(elear).attr('value') != undefined)) {
            sheet_sec.getRange(row, answ++).setValue(AvQ(elear).attr('value'));
          } 
        });    
      } 

      });  
      
       
    
    
    }
 
    
    
    
    
    
    
    
    
    
    
    
    
    
   
  
  } 
  else {
    Logger.log("Авторизационные данные не найдены");
  } 
}



function Download_Hints(lvl) {
  console.info("Парсим уровень " + lvl);
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();
  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0) & (cells[0][9].toString().length > 0)) {
    
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();
    auth(login,pass,domain); 
    var headers = {
      'Cookie': CacheService.getUserCache().get('auth')
    };
    var params = {
      'headers': headers,
      muteHttpExceptions: true
    };  
    var bon_num = 1;
    
    var ss = SpreadsheetApp.getActive();
    var sheet_tmp = ss.getSheetByName('tmp');
    sheet_tmp.getRange(1, 1).setValue("lvl");
    sheet_tmp.getRange(1, 2).setValue("hint_id");
    
    
    var url = "https://"+ domain + "/Administration/Games/LevelEditor.aspx?level="+lvl+"&gid=" + gameid;
    var fetch =  UrlFetchApp.fetch(url, params);
    const $ = Cheerio.load(fetch.getContentText());
    $('table.bg_dark > tbody > tr > td > table > tbody > tr > td > a').each(function (index, element) {
      if ($(element).attr('href').indexOf('prid=') > 0 ) {
        var hint_id = $(element).attr('href').split('prid=')[1].split('\',')[0];  
        var row = sheet_tmp.getLastRow() + 1;
        sheet_tmp.getRange(row, 1).setValue(lvl);
        sheet_tmp.getRange(row, 2).setValue(hint_id);
      }
      
    });
    Utilities.sleep(1100);
    
  }  
  else {
    Logger.log("Авторизационные данные не найдены");
  } 
}



function Download_Hint(lvl,hint_id) {
  console.info("Парсим подсказки уровня " + lvl);
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();
  
 
  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0)) {
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();
    
    
    
    
    if (CacheService.getUserCache().get('auth') == null) {
      auth(login,pass,domain); 
    }
    
    var headers = {
      'Cookie': CacheService.getUserCache().get('auth')
    };
    var params = {
      'headers': headers,
      muteHttpExceptions: true
    };  
  //console.info(headers);
  var sheet_hint =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Подсказки');
  var row = sheet_hint.getLastRow() + 1;
 //   console.info(row);
  sheet_hint.getRange(row, 3).setValue(lvl);    
  sheet_hint.getRange(row, 4).setValue("=INDEX(lvl_id;MATCH(C"+(row)+";lvl_num;0);1)");

  var url_hint = "https://"+ domain + "/Administration/Games/PromptEdit.aspx?action=PromptEdit&gid=" + gameid +"&level=" + lvl + "&prid=" + hint_id;  
  var fetch_hint =  UrlFetchApp.fetch(url_hint, params);
  const BQ = Cheerio.load(fetch_hint.getContentText());
  sheet_hint.getRange(row, 10).setValue(BQ('select > option:selected').attr('value')); 
  sheet_hint.getRange(row, 2).setValue(BQ('textarea').text());  
     console.info(BQ('textarea').text()); 
  BQ('input').each(function (ind, ele) {
    if ((BQ(ele).attr('name') == "NewPromptTimeoutDays") && (BQ(ele).attr('value') != undefined)) {
      sheet_hint.getRange(row, 5).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "NewPromptTimeoutHours") && (BQ(ele).attr('value') != undefined))  {
      sheet_hint.getRange(row, 6).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "NewPromptTimeoutMinutes") && (BQ(ele).attr('value') != undefined))  {
      sheet_hint.getRange(row, 7).setValue(BQ(ele).attr('value'));
    }
    if ((BQ(ele).attr('name') == "NewPromptTimeoutSeconds") && (BQ(ele).attr('value') != undefined))  {
      sheet_hint.getRange(row, 8).setValue(BQ(ele).attr('value'));
    }
  });   
   
  
 
  } 
  else {
    Logger.log("Авторизационные данные не найдены");
  } 
}



function Download_Tasks(lvl) {
  console.info("Парсим уровень " + lvl);
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();
  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0) & (cells[0][9].toString().length > 0)) {
    
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();
    auth(login,pass,domain); 
    var headers = {
      'Cookie': CacheService.getUserCache().get('auth')
    };
    var params = {
      'headers': headers,
      muteHttpExceptions: true
    };  
    var bon_num = 1;
    
    var ss = SpreadsheetApp.getActive();
    var sheet_tmp = ss.getSheetByName('tmp');
    sheet_tmp.getRange(1, 1).setValue("lvl");
    sheet_tmp.getRange(1, 2).setValue("task_id");
    
    
    var url = "https://"+ domain + "/Administration/Games/LevelEditor.aspx?level="+lvl+"&gid=" + gameid;
    var fetch =  UrlFetchApp.fetch(url, params);
    const $ = Cheerio.load(fetch.getContentText());
    $('table.bg_dark > tbody > tr > td > table > tbody > tr > td > a').each(function (index, element) {
      if ($(element).attr('href').indexOf('tid=') > 0 ) {
        var task_id = $(element).attr('href').split('tid=')[1].split('\',')[0];  
        var row = sheet_tmp.getLastRow() + 1;
        sheet_tmp.getRange(row, 1).setValue(lvl);
        sheet_tmp.getRange(row, 2).setValue(task_id);
      }
      
    });
    Utilities.sleep(1100);
    
  }  
  else {
    Logger.log("Авторизационные данные не найдены");
  } 
}







function Download_Task(lvl,task_id) {
  console.info("Парсим подсказки уровня " + lvl);
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();
  
 
  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0)) {
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();
    
    
    
    
    if (CacheService.getUserCache().get('auth') == null) {
      auth(login,pass,domain); 
    }
    
    var headers = {
      'Cookie': CacheService.getUserCache().get('auth')
    };
    var params = {
      'headers': headers,
      muteHttpExceptions: true
    };  
  //console.info(headers);
  var sheet_task =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Задания');
  var row = sheet_task.getLastRow() + 1;
 //   console.info(row);
  sheet_task.getRange(row, 3).setValue(lvl);    
  sheet_task.getRange(row, 4).setValue("=INDEX(lvl_id;MATCH(C"+(row)+";lvl_num;0);1)");
  
  var url_hint = "https://"+ domain + "/Administration/Games/TaskEdit.aspx?action=TaskEdit&gid=" + gameid +"&level=" + lvl + "&tid=" + task_id;  
  var fetch_hint =  UrlFetchApp.fetch(url_hint, params);
  const BQ = Cheerio.load(fetch_hint.getContentText());
    
    if (  BQ('input').attr('checked') !== undefined ) {
     sheet_task.getRange(row, 5).setValue('да'); 
    }
    
  sheet_task.getRange(row, 7).setValue(BQ('select > option:selected').attr('value')); 
  sheet_task.getRange(row, 2).setValue(BQ('textarea').text());  

  } 
  else {
    Logger.log("Авторизационные данные не найдены");
  } 
}





function Download_Comments(lvl) {
  console.info("Парсим комментарии уровня " + lvl);
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();
  
 
  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0)) {
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();
    
    
    
    
    if (CacheService.getUserCache().get('auth') == null) {
      auth(login,pass,domain); 
    }
    
    var headers = {
      'Cookie': CacheService.getUserCache().get('auth')
    };
    var params = {
      'headers': headers,
      muteHttpExceptions: true
    };  
  //console.info(headers);
  var sheet_comm =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Комментарии');
  var row = sheet_comm.getLastRow() + 1;
    console.info(row);
  sheet_comm.getRange(row, 3).setValue(lvl);    
  sheet_comm.getRange(row, 4).setValue("=INDEX(lvl_id;MATCH(C"+(row)+";lvl_num;0);1)");
  sheet_comm.getRange(row, 5).setValue("=INDEX(lvl_all;MATCH(C"+(row)+";lvl_num;0);2)");
  var url_bonus = "https://"+ domain + "/Administration/Games/NameCommentEdit.aspx?gid=" + gameid +"&level=" + lvl;  
  var fetch_bonus =  UrlFetchApp.fetch(url_bonus, params);
  const BQ = Cheerio.load(fetch_bonus.getContentText());
  BQ('textarea').each(function (ind, ele) {
    if (BQ(ele).attr('name') == "txtLevelComment" ) {
      sheet_comm.getRange(row, 2).setValue(BQ(ele).text());
    }
  });
  } 
  else {
    Logger.log("Авторизационные данные не найдены");
  } 
}



function Download_Monitor_1() {
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();

  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0)) {
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();
    var lvl = cells[0][9].toString();
    if (cells[0][11]) {
      var team_id = cells[0][11].toString();
    }
    else {
      var team_id = "";
    }
    
    //var gameid = '30361';
    
    if (CacheService.getUserCache().get('auth') == null) {
      auth(login,pass,domain); 
    }
    
    var headers = {
      'Cookie': CacheService.getUserCache().get('auth')
    };
    var params = {
      'headers': headers,
      muteHttpExceptions: true
    };    
    
    var url_bonus = "https://"+ domain + "/ALoader/GameLoader.aspx?gid=" + gameid +"&item=0&page=1" + "&levels=" + lvl + "&teamname=" +team_id; 
    console.log(url_bonus);
    var fetch_bonus =  UrlFetchApp.fetch(url_bonus, params);
    const BQ = Cheerio.load(fetch_bonus.getContentText());

    if( parseInt(BQ('a').last().text()) > 1 ) {
    for ( i=1; i <=  parseInt(BQ('a').last().text()) ; i++ ) {
      Download_Monitor(i, 0);
      
    }
    } 
    else {
       Download_Monitor(1, 0);
    }
    
  }
}

function include(filename){
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function setvalueCell(data) {
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getActiveCell();
  range.setValue(data);
}


function previewCell() {

  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getActiveCell();
  var vals = range.getValue();
  //var userInterface = HtmlService.createHtmlOutputFromFile("editor");
  var userInterface = HtmlService.createTemplateFromFile("editor");
  userInterface.dataFromSheets = vals;  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  SpreadsheetApp.getUi().showModalDialog(userInterface.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).setHeight(500).setWidth(850), 'Редактор HTML');
  //ss.show(userInterface);

}



function Download_Monitor(page, type) {
  console.info("Парсим мониторинг основных ответов. Страница " + page);
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();
  
 
  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0)) {
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();
    var lvl = cells[0][9].toString();
    if (cells[0][11]) {
      var team_id = cells[0][11].toString();
    }
    else {
      var team_id = "";
    }
    //var gameid = '30361';
    
    if (CacheService.getUserCache().get('auth') == null) {
      auth(login,pass,domain); 
    }
    
    var headers = {
      'Cookie': CacheService.getUserCache().get('auth')
    };
    var params = {
      'headers': headers,
      muteHttpExceptions: true
    };  
  //console.info(headers);
  var sheet_comm =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Мониторинг');


  var url_bonus = "https://"+ domain + "/ALoader/GameLoader.aspx?gid=" + gameid +"&item=0&page=" + page + "&levels=" + lvl + "&teamname=" +team_id;  
  var fetch_bonus =  UrlFetchApp.fetch(url_bonus, params);
  const BQ = Cheerio.load(fetch_bonus.getContentText());
  BQ('#MonitoringForm > table > tbody > tr:nth-child(5) > td > table > tbody > tr').each(function (ind, ele) {
    var row = sheet_comm.getLastRow() + 1;  
    if (BQ(ele).children().length == 5 ) {
      BQ(ele).children().each(function (inda, elea) {
      if ( BQ(elea).attr('class').indexOf('ext4') >= 0 ) {
       sheet_comm.getRange(row, inda+1).setValue(BQ(elea).text());   
      }
      });
    }
  });
  } 
  else {
    Logger.log("Авторизационные данные не найдены");
  } 
}







// Auth flow
function auth(login, password, domain) {
  auth_(login, password, domain);
  var cache = CacheService.getUserCache().get('auth');
  if (!cache)
    auth_(login, password, domain);
}

function auth_(login, password, domain) {
  var payload = {
    Login: login,
    Password: password,
    ddlNetwork: "1"
  }; 
  var params = {
    'method'  : 'POST',
    'payload' : payload,
    'followRedirects' : false
  };
  var fetch = UrlFetchApp.fetch('https://'+domain+'/Login.aspx?lang=ru', params);
  var headers = fetch.getAllHeaders();
  
  if ( typeof headers['Set-Cookie'] !== 'undefined' ) {
    var cookies = typeof headers['Set-Cookie'] == 'string' ? [ headers['Set-Cookie'] ] : headers['Set-Cookie'];
    for (var i = 0; i < cookies.length; i++  ) {
      cookies[i] = cookies[i].split( ';' )[0];  
    };
    
  }
  CacheService.getUserCache().put('auth', cookies.join(';'));  
  return fetch;
}






























/**
 * Presents UI to user.
 */
function updateData () {
  var userInterface = HtmlService.createHtmlOutputFromFile("prepare")
                                 .setHeight(150)
                                 .setWidth(550)
                                 .setTitle("Подготавливаем данные к загрузке бонусов?");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.show(userInterface)
}

function updateData2 () {
  var userInterface = HtmlService.createHtmlOutputFromFile("download")
                                 .setHeight(150)
                                 .setWidth(550)
                                 .setTitle("Скачиваем бонусы?");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.show(userInterface)
}


function updateData3 () {
  var userInterface = HtmlService.createHtmlOutputFromFile("download2")
                                 .setHeight(150)
                                 .setWidth(550)
                                 .setTitle("Скачиваем комментарии?");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.show(userInterface)
}

function updateData4 () {
  var userInterface = HtmlService.createHtmlOutputFromFile("download3")
                                 .setHeight(150)
                                 .setWidth(550)
                                 .setTitle("Скачиваем секторы?");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.show(userInterface)
}

function updateData5 () {
  var userInterface = HtmlService.createHtmlOutputFromFile("prepare2")
                                 .setHeight(150)
                                 .setWidth(550)
                                 .setTitle("Подготавливаем данные к загрузке подсказок?");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.show(userInterface)
}

function updateData6 () {
  var userInterface = HtmlService.createHtmlOutputFromFile("download4")
                                 .setHeight(150)
                                 .setWidth(550)
                                 .setTitle("Скачиваем подсказки?");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.show(userInterface)
}

function updateData7 () {
  var userInterface = HtmlService.createHtmlOutputFromFile("prepare3")
                                 .setHeight(150)
                                 .setWidth(550)
                                 .setTitle("Подготавливаем данные к загрузке заданий?");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.show(userInterface)
}

function updateData8 () {
  var userInterface = HtmlService.createHtmlOutputFromFile("download5")
                                 .setHeight(150)
                                 .setWidth(550)
                                 .setTitle("Скачиваем задания?");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.show(userInterface)
}


function updateData9 () {
  var userInterface = HtmlService.createHtmlOutputFromFile("download6")
                                 .setHeight(150)
                                 .setWidth(550)
                                 .setTitle("Скачиваем уровни?");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.show(userInterface)
}


/**
 * Called from client, this function performs the server work in
 * intervals. It will exit when processing time has exceeded MAX_INTERVAL,
 * 3.5 minutes. Every time this function exits, the client is provided
 * with the current status object, done=true when the work queue has
 * been emptied.
 *
 * @returns {Object}      Status { done: boolean }
 */
function serverProcess() {
  var MAX_INTERVAL = (3.5 * 60);  // minutes * seconds
  var intervalStart = Math.round(new Date() / 1000);

  // Get persisted work queue, if there is one
  var queueProp = properties.getProperty('work-queue') || '[]';
  var queue = JSON.parse(queueProp);

  if (queue.length == 0) {
    queue = prepareWork();
  }

  // Do the work for this interval, until we're out of time
  while ((Math.round(new Date() / 1000) - intervalStart) < MAX_INTERVAL) {
    if (queue.length > 0) {
      var ssID = queue.shift();
      Download_Bonuses(ssID);
      properties.setProperty('work-queue', JSON.stringify(queue));
    }
    else break;
  }

  // Report result of this interval to client
  var result = { done : (queue.length == 0) };
  return( result );
}



function serverProcess2() {
  var MAX_INTERVAL = (3.5 * 60);  // minutes * seconds
  var intervalStart = Math.round(new Date() / 1000);

  // Get persisted work queue, if there is one
  var queueProp = properties.getProperty('work-queue-1') || '[]';
  var queue = JSON.parse(queueProp);
  if (queue.length == 0) {
    queue = prepareWork2();
  }

  // Do the work for this interval, until we're out of time
  while ((Math.round(new Date() / 1000) - intervalStart) < MAX_INTERVAL) {
    if (queue.length > 0) {
      var ssID = queue.shift();
      //console.info(ssID);
      Download_Bonus(ssID[0],ssID[1]);
      properties.setProperty('work-queue-1', JSON.stringify(queue));
      //var result = { queue : queue.length };
      //return (result);
    }
    else break;
  }

  // Report result of this interval to client
  var result = { done : (queue.length == 0) };
  return( result );
}


function serverProcess3() {
  var MAX_INTERVAL = (3.5 * 60);  // minutes * seconds
  var intervalStart = Math.round(new Date() / 1000);

  // Get persisted work queue, if there is one
  var queueProp = properties.getProperty('work-queue-2') || '[]';
  var queue = JSON.parse(queueProp);

  if (queue.length == 0) {
    queue = prepare_comments();
  }

  // Do the work for this interval, until we're out of time
  while ((Math.round(new Date() / 1000) - intervalStart) < MAX_INTERVAL) {
    if (queue.length > 0) {
      var ssID = queue.shift();
      Download_Comments(ssID);
      properties.setProperty('work-queue-2', JSON.stringify(queue));
    }
    else break;
  }

  // Report result of this interval to client
  var result = { done : (queue.length == 0) };
  return( result );
}

function serverProcess4() {
  var MAX_INTERVAL = (3.5 * 60);  // minutes * seconds
  var intervalStart = Math.round(new Date() / 1000);

  // Get persisted work queue, if there is one
  var queueProp = properties.getProperty('work-queue-3') || '[]';
  var queue = JSON.parse(queueProp);

  if (queue.length == 0) {
    queue = prepare_sectors();
  }

  // Do the work for this interval, until we're out of time
  while ((Math.round(new Date() / 1000) - intervalStart) < MAX_INTERVAL) {
    if (queue.length > 0) {
      var ssID = queue.shift();
      Download_Sectors(ssID);
      properties.setProperty('work-queue-3', JSON.stringify(queue));
    }
    else break;
  }

  // Report result of this interval to client
  var result = { done : (queue.length == 0) };
  return( result );
}


function serverProcess5() {
  var MAX_INTERVAL = (3.5 * 60);  // minutes * seconds
  var intervalStart = Math.round(new Date() / 1000);

  // Get persisted work queue, if there is one
  var queueProp = properties.getProperty('work-queue-4') || '[]';
  var queue = JSON.parse(queueProp);

  if (queue.length == 0) {
    queue = prepare_hints();
  }

  // Do the work for this interval, until we're out of time
  while ((Math.round(new Date() / 1000) - intervalStart) < MAX_INTERVAL) {
    if (queue.length > 0) {
      var ssID = queue.shift();
      Download_Hints(ssID);
      properties.setProperty('work-queue-4', JSON.stringify(queue));
    }
    else break;
  }

  // Report result of this interval to client
  var result = { done : (queue.length == 0) };
  return( result );
}


function serverProcess6() {
  var MAX_INTERVAL = (3.5 * 60);  // minutes * seconds
  var intervalStart = Math.round(new Date() / 1000);

  // Get persisted work queue, if there is one
  var queueProp = properties.getProperty('work-queue-5') || '[]';
  var queue = JSON.parse(queueProp);
  if (queue.length == 0) {
    queue = prepare_hint();
  }

  // Do the work for this interval, until we're out of time
  while ((Math.round(new Date() / 1000) - intervalStart) < MAX_INTERVAL) {
    if (queue.length > 0) {
      var ssID = queue.shift();
      //console.info(ssID);
      Download_Hint(ssID[0],ssID[1]);
      properties.setProperty('work-queue-5', JSON.stringify(queue));
      //var result = { queue : queue.length };
      //return (result);
    }
    else break;
  }

  // Report result of this interval to client
  var result = { done : (queue.length == 0) };
  return( result );
}

function serverProcess7() {
  var MAX_INTERVAL = (3.5 * 60);  // minutes * seconds
  var intervalStart = Math.round(new Date() / 1000);

  // Get persisted work queue, if there is one
  var queueProp = properties.getProperty('work-queue-6') || '[]';
  var queue = JSON.parse(queueProp);
 

  if (queue.length == 0) {
    queue = prepare_tasks();
  }

  // Do the work for this interval, until we're out of time
  while ((Math.round(new Date() / 1000) - intervalStart) < MAX_INTERVAL) {
    if (queue.length > 0) {
      var ssID = queue.shift();
      Download_Tasks(ssID);
      properties.setProperty('work-queue-6', JSON.stringify(queue));
    }
    else break;
  }

  // Report result of this interval to client
  var result = { done : (queue.length == 0) };
  return( result );
}


function serverProcess8() {
  var MAX_INTERVAL = (3.5 * 60);  // minutes * seconds
  var intervalStart = Math.round(new Date() / 1000);

  // Get persisted work queue, if there is one
  var queueProp = properties.getProperty('work-queue-7') || '[]';
  var queue = JSON.parse(queueProp);
  if (queue.length == 0) {
    queue = prepare_task();
  }

  // Do the work for this interval, until we're out of time
  while ((Math.round(new Date() / 1000) - intervalStart) < MAX_INTERVAL) {
    if (queue.length > 0) {
      var ssID = queue.shift();
      //console.info(ssID);
      Download_Task(ssID[0],ssID[1]);
      properties.setProperty('work-queue-7', JSON.stringify(queue));
      //var result = { queue : queue.length };
      //return (result);
    }
    else break;
  }

  // Report result of this interval to client
  var result = { done : (queue.length == 0) };
  return( result );
}


function serverProcess9() {
  var MAX_INTERVAL = (3.5 * 60);  // minutes * seconds
  var intervalStart = Math.round(new Date() / 1000);

  // Get persisted work queue, if there is one
  var queueProp = properties.getProperty('work-queue-8') || '[]';
  var queue = JSON.parse(queueProp);

  if (queue.length == 0) {
    queue = prepare_levels();
  }

  // Do the work for this interval, until we're out of time
  while ((Math.round(new Date() / 1000) - intervalStart) < MAX_INTERVAL) {
    if (queue.length > 0) {
      var ssID = queue.shift();
      Download_Levels(ssID[0],ssID[1]);
      properties.setProperty('work-queue-8', JSON.stringify(queue));
    }
    else break;
  }

  // Report result of this interval to client
  var result = { done : (queue.length == 0) };
  return( result );
}


/**
 * Set up work queue & clear Master sheet, ready to import data from source sheets.
 *
 * @return {String[]}             work queue
 */
function prepareWork() {
  // No work yet, so set up work
  var hh = SpreadsheetApp.getActive();
  var masterSheet = hh.getSheetByName('tmp');
  var rowsToDelete = masterSheet.getMaxRows()-1;
  console.log(rowsToDelete);
  if (rowsToDelete > 0 ) {
    masterSheet.deleteRows(1, rowsToDelete);  //Clear our master sheet aka Sheet All
  }
  // Build work queue
  var queue = []; 
  var masterSheet = hh.getSheetByName('Тех');
  var rowsmax = masterSheet.getMaxRows();
  var data = masterSheet.getRange("A4:A"+rowsmax).getValues();      // get all data
  for (var i=0; i<data.length; i++) {
    if(data[i][0] > 0 ) {
    queue.push(data[i][0].toString());                   // queue up the work
    }
  }
  // Persist the work queue as a scriptProperty
  properties.setProperty('work-queue', JSON.stringify(queue));
  return queue;
}


function prepareWork2() {
  // No work yet, so set up work
  var ss = SpreadsheetApp.getActive();
  // Build work queue
  var queue = []; 
  var masterSheet = ss.getSheetByName('tmp');
  var rowsmax = masterSheet.getMaxRows();
  console.error("A2:B"+rowsmax);
  var data = masterSheet.getRange("A2:B"+rowsmax).getValues();      // get all data
  for (var i=0; i<data.length; i++) {
    if(data[i][0] > 0 ) {
    var queue_one = [];
    queue_one[0] = data[i][0].toString();
    queue_one[1]  = data[i][1].toString();
    queue.push(queue_one);                   // queue up the work
    }
  }
  // Persist the work queue as a scriptProperty
  //console.log(JSON.stringify(queue)) ;
  properties.setProperty('work-queue-1', JSON.stringify(queue));
  //Logger.log(queue);
  return queue;
}

function prepare_levels() {
  var sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Тех');
  var cells = sheet.getDataRange().getValues();
  var queue = [];
  if ((cells[0][1].toString().length > 0) & (cells[0][3].toString().length > 0) & (cells[0][5].toString().length > 0) & (cells[0][7].toString().length > 0)) {
    
    var login = cells[0][1].toString();
    var pass = cells[0][3].toString();
    var domain = cells[0][5].toString();
    var gameid = cells[0][7].toString();
    
    var url = "https://"+ domain + "/Administration/Games/LevelManager.aspx?gid=" + gameid;  
    
    auth(login,pass,domain); 
    var headers = {
      'Cookie': CacheService.getUserCache().get('auth')
    };
    var params = {
      'headers': headers,
      muteHttpExceptions: true
    };  
    var lvl = [];
    var fetch =  UrlFetchApp.fetch(url, params);
    const $ = Cheerio.load(fetch.getContentText());
    $('.textbox').each(function (index, element) {
    if (($(element).attr('value') != undefined) && ($(element).attr('name').indexOf('xtLevelName') >= 0 )) {
        
        var onelvl = [];
        onelvl[0] = $(element).attr('value');
        onelvl[1] = $(element).attr('name').substring(13, $(element).attr('name').length);
        lvl.push(onelvl);
      }
    });
    
    
  for (var i=0; i<lvl.length; i++) {
 //   if(data[i][0] > 0 ) {
    var queue_one = [];
    queue_one[0] = (i+1).toString();
    queue_one[1]  = lvl[i][1].toString();
    queue.push(queue_one);                      // queue up the work
 //   }
  }
  // Persist the work queue as a scriptProperty
  properties.setProperty('work-queue-8', JSON.stringify(queue));
  return queue;
    
  }  
  else {
    Logger.log("Авторизационные данные не найдены");
  }  
      
}



function prepare_comments() {
  // No work yet, so set up work
  var hh = SpreadsheetApp.getActive();
  // Build work queue
  var queue = []; 
  var masterSheet = hh.getSheetByName('Тех');
  var rowsmax = masterSheet.getMaxRows();
  var data = masterSheet.getRange("A4:A"+rowsmax).getValues();      // get all data
  for (var i=0; i<data.length; i++) {
    if(data[i][0] > 0 ) {
    queue.push(data[i][0].toString());                   // queue up the work
    }
  }
  // Persist the work queue as a scriptProperty
  properties.setProperty('work-queue-2', JSON.stringify(queue));
  return queue;
}


function prepare_sectors() {
  // No work yet, so set up work
  var hh = SpreadsheetApp.getActive();
  // Build work queue
  var queue = []; 
  var masterSheet = hh.getSheetByName('Тех');
  var rowsmax = masterSheet.getMaxRows();
  var data = masterSheet.getRange("A4:A"+rowsmax).getValues();      // get all data
  for (var i=0; i<data.length; i++) {
    if(data[i][0] > 0 ) {
    queue.push(data[i][0].toString());                   // queue up the work
    }
  }
  // Persist the work queue as a scriptProperty
  properties.setProperty('work-queue-3', JSON.stringify(queue));
  return queue;
}

function prepare_hints() {
  // No work yet, so set up work
  var hh = SpreadsheetApp.getActive();
  var masterSheet = hh.getSheetByName('tmp');
  var rowsToDelete = masterSheet.getMaxRows()-1;
  if (rowsToDelete > 0 ) {
    masterSheet.deleteRows(1, rowsToDelete);  //Clear our master sheet aka Sheet All
  }
  // Build work queue
  var queue = []; 
  var masterSheet = hh.getSheetByName('Тех');
  var rowsmax = masterSheet.getMaxRows();
  var data = masterSheet.getRange("A4:A"+rowsmax).getValues();      // get all data
  for (var i=0; i<data.length; i++) {
    if(data[i][0] > 0 ) {
    queue.push(data[i][0].toString());                   // queue up the work
    }
  }
  // Persist the work queue as a scriptProperty
  properties.setProperty('work-queue-4', JSON.stringify(queue));
  return queue;
}


function prepare_hint() {
  // No work yet, so set up work
  var ss = SpreadsheetApp.getActive();
  // Build work queue
  var queue = []; 
  var masterSheet = ss.getSheetByName('tmp');
  var rowsmax = masterSheet.getMaxRows();
  console.error("A2:B"+rowsmax);
  var data = masterSheet.getRange("A2:B"+rowsmax).getValues();      // get all data
  for (var i=0; i<data.length; i++) {
    if(data[i][0] > 0 ) {
    var queue_one = [];
    queue_one[0] = data[i][0].toString();
    queue_one[1]  = data[i][1].toString();
    queue.push(queue_one);                   // queue up the work
    }
  }
  // Persist the work queue as a scriptProperty
  //console.log(JSON.stringify(queue)) ;
  properties.setProperty('work-queue-5', JSON.stringify(queue));
  //Logger.log(queue);
  return queue;
}



function prepare_tasks() {
  // No work yet, so set up work
  var hh = SpreadsheetApp.getActive();
  var masterSheet = hh.getSheetByName('tmp');
  var rowsToDelete = masterSheet.getMaxRows()-1;
  if (rowsToDelete > 0 ) {
    masterSheet.deleteRows(1, rowsToDelete);  //Clear our master sheet aka Sheet All
  }
  // Build work queue
  var queue = []; 
  var masterSheet = hh.getSheetByName('Тех');
  var rowsmax = masterSheet.getMaxRows();
  var data = masterSheet.getRange("A4:A"+rowsmax).getValues();      // get all data
  for (var i=0; i<data.length; i++) {
    if(data[i][0] > 0 ) {
    queue.push(data[i][0].toString());                   // queue up the work
    }
  }
  // Persist the work queue as a scriptProperty
  properties.setProperty('work-queue-6', JSON.stringify(queue));
  return queue;
}


function prepare_task() {
  // No work yet, so set up work
  var ss = SpreadsheetApp.getActive();
  // Build work queue
  var queue = []; 
  var masterSheet = ss.getSheetByName('tmp');
  var rowsmax = masterSheet.getMaxRows();
  console.error("A2:B"+rowsmax);
  var data = masterSheet.getRange("A2:B"+rowsmax).getValues();      // get all data
  for (var i=0; i<data.length; i++) {
    if(data[i][0] > 0 ) {
    var queue_one = [];
    queue_one[0] = data[i][0].toString();
    queue_one[1]  = data[i][1].toString();
    queue.push(queue_one);                   // queue up the work
    }
  }
  // Persist the work queue as a scriptProperty
  //console.log(JSON.stringify(queue)) ;
  properties.setProperty('work-queue-7', JSON.stringify(queue));
  //Logger.log(queue);
  return queue;
}


function prepare_monitoring_main() {
  // No work yet, so set up work
  var ss = SpreadsheetApp.getActive();
  // Build work queue
  var queue = []; 
  
  
  
  var masterSheet = ss.getSheetByName('tmp');
  var rowsmax = masterSheet.getMaxRows();
  console.error("A2:B"+rowsmax);
  var data = masterSheet.getRange("A2:B"+rowsmax).getValues();      // get all data
  for (var i=0; i<data.length; i++) {
    if(data[i][0] > 0 ) {
    var queue_one = [];
    queue_one[0] = data[i][0].toString();
    queue_one[1]  = data[i][1].toString();
    queue.push(queue_one);                   // queue up the work
    }
  }
  // Persist the work queue as a scriptProperty
  //console.log(JSON.stringify(queue)) ;
  properties.setProperty('work-queue-7', JSON.stringify(queue));
  //Logger.log(queue);
  return queue;
}








function clearProperty() {
  properties.deleteProperty('work-queue');
  properties.deleteProperty('work-queue-1');
  properties.deleteProperty('work-queue-2');
  properties.deleteProperty('work-queue-3');
  properties.deleteProperty('work-queue-4');
  properties.deleteProperty('work-queue-5');
  properties.deleteProperty('work-queue-6');
  properties.deleteProperty('work-queue-7');
  properties.deleteProperty('work-queue-8');
}



function getQueue() {
 var queueProp = properties.getProperty('work-queue-1');
  var queue = JSON.parse(queueProp);
  //console.info(queue.length);
  return queue.length; 
}


function Help() {
  var userInterface = HtmlService.createHtmlOutputFromFile("help")
                                 .setHeight(350)
                                 .setWidth(550)
                                 .setTitle("Справка по функционалу");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.show(userInterface)
}



//Добавление и удаление начислений //Temig
function submitBonusPenaltyTime() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const authSheet = ss.getSheetByName("Тех");
  const login = authSheet.getRange("B1").getValue();
  const password = authSheet.getRange("D1").getValue();
  const domain = authSheet.getRange("F1").getValue();
  const gid = authSheet.getRange("H1").getValue();

  const bonusPenaltyTimeSheet = ss.getSheetByName("Начисления");
  const bonusData = bonusPenaltyTimeSheet.getRange(`J3:Q${bonusPenaltyTimeSheet.getDataRange().getLastRow()}`).getValues();

  //Авторизация и заполнение кук в кэш
  auth(login, password, domain);

  const authToken = CacheService.getUserCache().get('auth')

  // получим id уровней и команд
  const baseUrl = `https://${domain}/GameBonusPenaltyTime.aspx?gid=${gid}`;
  
  const getOptions = {
    'method': 'get',
    'headers': {'Cookie': authToken}
  }
  const response = UrlFetchApp.fetch(`${baseUrl}&action=add`, getOptions);
  if (response.getResponseCode() !== 200) {
    Logger.log(`Error fetching team/level data: ${response.getResponseCode()} - ${response.getContentText()}`)
    return false; // Stop execution on failure
  }
  
  const $ = Cheerio.load(response.getContentText());
  
  // получаем команды в игре и их id
  const teamData = {};
  $('select[name="ddlEditCorrectionPlayers"] option').each((index, element) => {
    teamData[$(element).text()] = $(element).attr('value');
  });
  
  // получаем уровни в игре и их id
  const levelData = {};
  $('select[name="ddlEditCorrectionLevels"] option').each((index, element) => {
    levelData[$(element).text()] = $(element).attr('value');
  });
  
  const submitUrl = `${baseUrl}&action=save`;
  //проход по назначаемым бонусам \ штрафам
  for (let i = 0; i < bonusData.length; i++) {
    const row = bonusData[i];
    if (row[0] === "") continue; //Скипаем пустые
    const playerName = row[0].toString();
    const levelName = row[1].toString();
    const comment = row[2].toString();
    const correctionType = row[3].toString();
    const days = row[4].toString();
    const hours = row[5].toString();
    const minutes = row[6].toString();
    const seconds = row[7].toString();
    
    const playerId = teamData[playerName];
    const levelId = levelName === "0" ? "0" : levelData[levelName];
    if (!playerId || !levelId) {
      Logger.log(`Player or level not found for ${playerName} / ${levelName}`)
      bonusPenaltyTimeSheet.getRange(`J${i+3}:Q${i+3}`).setBackground('#FF0000') //раскрасить в красный, если не найдена команда или уровень
      continue;
    }

    const submitOpt = {
      'method': 'post',
      'payload': {
        "radioCorrectionType": correctionType,
        "ddlEditCorrectionPlayers": playerId,
        "ddlEditCorrectionLevels": levelId,
        "DaysList": days,
        "HoursList": hours,
        "MinutesList": minutes,
        "SecondsList": seconds,
        "txtEditCorrectionComment": comment
      },
      'headers':{'Cookie': authToken}
    }
    UrlFetchApp.fetch(submitUrl, submitOpt);
    Utilities.sleep(1100);

  }
}

// Получение списка команд
function getPlayers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const authSheet = ss.getSheetByName("Тех");
  const login = authSheet.getRange("B1").getValue();
  const password = authSheet.getRange("D1").getValue();
  const domain = authSheet.getRange("F1").getValue();
  const gid = authSheet.getRange("H1").getValue();

  const bonusPenaltyTimeSheet = ss.getSheetByName("Начисления");

  auth(login, password, domain);

  const url = `https://${domain}/GameBonusPenaltyTime.aspx?action=add&gid=${gid}`;
  const options = {
    'method': 'get',
    'headers': {
    'Cookie': CacheService.getUserCache().get('auth')
    }
  }
  const response = UrlFetchApp.fetch(url, options);
  const $ = Cheerio.load(response.getContentText());
  const teamData = {};
  
  $('select[name="ddlEditCorrectionPlayers"] option').each((index, element) => {
    teamData[$(element).text()] = $(element).attr('value');
  });
  
  //очищаем список команд
  bonusPenaltyTimeSheet.getRange('T3:T').clearContent();

  let row = 3;
  for (const teamName in teamData) {
    bonusPenaltyTimeSheet.getRange(`T${row}`).setValue("'" + teamName);
    row++;
  }
}

//Получение списка начислений бонусов и штрафов
function getBonusPenaltyTime() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const bonusPenaltyTimeSheet = ss.getSheetByName("Начисления");
  const authSheet = ss.getSheetByName("Тех");
  const login = authSheet.getRange("B1").getValue();
  const password = authSheet.getRange("D1").getValue();
  const domain = authSheet.getRange("F1").getValue();
  const gid = authSheet.getRange("H1").getValue();
  
  auth(login, password, domain);

  const url = `https://${domain}/GameBonusPenaltyTime.aspx?gid=${gid}&lang=ru`;
  const options = {
    'method': 'get',
    'headers': {'Cookie': CacheService.getUserCache().get('auth')}
  }

  const response = UrlFetchApp.fetch(url, options);
  const $ = Cheerio.load(response.getContentText());
  //очищаем список бонусов
  bonusPenaltyTimeSheet.getRange('A3:H').clearContent();
  const data = []
  $('tr.toWinnerItem').each((index, element) => {
    const tds = $(element).find('td');
    let link = $(tds[4]).find('a').attr('href')
    if (!link){
      link = $(tds[4]).find('a.error').attr('href')
    }
    const rowData = [
      extractParameter(link, 'correct'),  //id уровня
      $(tds[0]).text(),                   //Дата и время начисления
      $(tds[1]).find('a').text(),         //Участник
      $(tds[2]).text(),                   //Номер уровня
      $(tds[3]).text(),                   //Причина
      $(tds[4]).find('a').text(),         //Время
      $(tds[5]).text(),                   //Коммент
    ];
    data.push(rowData);
  });
  bonusPenaltyTimeSheet.getRange(3, 2, data.length, data[0].length).setValues(data);

}

// Функция, которая получает get-параметр из url
function extractParameter(url, paramName) {
  if (!url) return null;
  const queryString = url.substring(url.indexOf('?') + 1);
  const params = queryString.split('&');
  for (const param of params) {
    const [key, value] = param.split('=');
    if (key === paramName) {
      return value;
    }
  }
  return null;
}

//Удаление помеченных бонусов
function deleteBonusPenaltyTime() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  
  const authSheet = ss.getSheetByName("Тех");
  const login = authSheet.getRange("B1").getValue();
  const password = authSheet.getRange("D1").getValue();
  const domain = authSheet.getRange("F1").getValue();
  const gid = authSheet.getRange("H1").getValue();
  
  auth(login,password, domain);

  const bonusPenaltyTimeSheet = ss.getSheetByName("Начисления");  
  const bonusData = bonusPenaltyTimeSheet.getRange(`A3:B${bonusPenaltyTimeSheet.getDataRange().getLastRow()}`).getValues();
  for (let i=0; i<bonusData.length; i++){
    if (bonusData[i][0].toString() !== "1") continue;
    const submitOpt = {
      'method': 'get',
      'headers': {'Cookie': CacheService.getUserCache().get('auth')}
    };
    UrlFetchApp.fetch(`https://${domain}/GameBonusPenaltyTime.aspx?gid=${gid}&action=delete&correct=${bonusData[i][1].toString()}`, submitOpt);
    Utilities.sleep(1100);
  }
}

