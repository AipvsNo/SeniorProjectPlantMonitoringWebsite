function generateFormsForProjects() {
  // Open the active spreadsheet and get the specific sheet.
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("TECH-GoogleForm"); // Adjust sheet name if needed.
  var data = sheet.getDataRange().getValues();

  // Loop through each row (skip header row, assumed to be row 1).
  for (var i = 1; i < data.length; i++) {
    var row = data[i];

    // If there is already a value in the FormLink column (Column F), skip this row.
    if (row[5] && row[5].toString().trim() !== "") {
      continue;
    }

    var projectId = row[0]; // Column A: Project ID
    var projectName = row[1]; // Column B: Project Name
    var subProject = row[2]; // Column C: Sub-Project
    var headStr = row[3]; // Column D: Head (comma-separated)
    var responsibilityStr = row[4]; // Column E: Responsibility (comma-separated)

    // Skip if any required field is missing.
    if (
      !projectId ||
      !projectName ||
      !subProject ||
      !headStr ||
      !responsibilityStr
    ) {
      continue;
    }

    // Parse Heads and Responsibilities into arrays.
    var heads = headStr.split(",").map(function (name) {
      return name.trim();
    });
    var responsibilities = responsibilityStr.split(",").map(function (name) {
      return name.trim();
    });

    // Create a unique list of users: heads first, then any responsibilities not in heads.
    var users = heads.slice();
    responsibilities.forEach(function (user) {
      if (heads.indexOf(user) === -1) {
        users.push(user);
      }
    });

    // Create a new Google Form with title: "Project Name - Sub-Project"
    var formTitle = projectName + " - " + subProject;
    var form = FormApp.create(formTitle);
    // No description is added.

    // Add an initial multiple-choice question for user selection.
    var userQuestion = form.addMultipleChoiceItem();
    userQuestion.setTitle("Please select your name:");

    // Object to map each user to the starting page of their branch.
    var userSections = {};

    // Build branching for each user.
    users.forEach(function (user) {
      if (heads.indexOf(user) !== -1) {
        // ----- Branch for Heads (Assessors) -----
        var headBranchStart = form.addPageBreakItem();
        headBranchStart.setTitle("ผู้ประเมิน:  " + user);

        // For each responsibility, create a separate page with grouped questions.
        responsibilities.forEach(function (resp) {
          var respPage = form.addPageBreakItem();
          respPage.setTitle(
            "รูปแบบการประเมิน: Director ประเมิน Operator, ประเมินลูกทีม: " +
              resp
          );
          form
            .addSectionHeaderItem()
            .setTitle(
              "5 = ดีมาก (Very Good) 4 = ดี (Good) 3 = ปานกลาง (Satisfactory) 2 = ต้องปรับปรุง (Needs Improvement) 1 = ต้องแก้ไขเร่งด่วน (Unsatisfactory)"
            );

          // Group 1: Performance
          form.addSectionHeaderItem().setTitle("ผลการทำงาน (Performance)");
          form
            .addScaleItem()
            .setTitle(
              resp +
                "--" +
                "QX1--" +
                "งานเสร็จทันกำหนดและมีความแม่นยำในการวางแผน"
            )
            .setBounds(1, 5);
          form
            .addScaleItem()
            .setTitle(resp + "--" + "QX2--" + "การทํางานให้มีคุณภาพ")
            .setBounds(1, 5);
          form
            .addScaleItem()
            .setTitle(resp + "--" + "QX3--" + "งานตรงตาม objective")
            .setBounds(1, 5);
          form
            .addScaleItem()
            .setTitle(resp + "--" + "QX4--" + "ทำงานครบ")
            .setBounds(1, 5);
          form
            .addScaleItem()
            .setTitle(resp + "--" + "QX5--" + "ความกระตือรือร้นในการทำงาน")
            .setBounds(1, 5);

          // Group 2: Work Ethics
          form
            .addSectionHeaderItem()
            .setTitle("ข้อพึงปฏิบัติในการทำงาน (Work Ethics)");
          form
            .addScaleItem()
            .setTitle(resp + "--" + "QX6--" + "สุภาพ อ่อนน้อม")
            .setBounds(1, 5);
          form
            .addScaleItem()
            .setTitle(resp + "--" + "QX7--" + "การเข้าร่วมประชุมอย่างสม่ำเสมอ")
            .setBounds(1, 5);
          form
            .addScaleItem()
            .setTitle(resp + "--" + "QX8--" + "การเข้าประชุมตรงต่อเวลา")
            .setBounds(1, 5);
          form
            .addScaleItem()
            .setTitle(resp + "--" + "QX9--" + "ระดับการมีส่วนร่วมในการสื่อสาร")
            .setBounds(1, 5);
          form
            .addScaleItem()
            .setTitle(resp + "--" + "QX10--" + "การจับประเด็นและทําความเข้าใจ")
            .setBounds(1, 5);
          form
            .addScaleItem()
            .setTitle(resp + "--" + "QX11--" + "การทำงานร่วมกับผู้อื่น")
            .setBounds(1, 5);

          // Group 3: Self-Development
          form
            .addSectionHeaderItem()
            .setTitle("การพัฒนาตนเอง (Self-Development)");
          form
            .addScaleItem()
            .setTitle(
              resp +
                "--" +
                "QX12--" +
                "การนำ feedback จาก team reflection มาปรับปรุง"
            )
            .setBounds(1, 5);
          form
            .addScaleItem()
            .setTitle(
              resp +
                "--" +
                "QX13--" +
                "ความสามารถในการเรียนรู้ และพัฒนาตลอดการทํางาน"
            )
            .setBounds(1, 5);
        });

        // Add a final page break that goes to submission.
        var finalPageHead = form.addPageBreakItem();
        finalPageHead.setTitle("Submit your responses");
        finalPageHead.setGoToPage(FormApp.PageNavigationType.SUBMIT);

        // Map this head user to the beginning of their branch.
        userSections[user] = headBranchStart;
      } else {
        // ----- Branch for Responsibility Users -----
        var respBranchStart = form.addPageBreakItem();
        respBranchStart.setTitle("ผู้ประเมิน: " + user);

        // Part 1: Assess Heads (Responsibility to Head)
        var part1Start = null;
        heads.forEach(function (head) {
          var pageForHead = form.addPageBreakItem();
          pageForHead.setTitle(
            "รูปแบบการประเมิน: Operator ประเมิน Director, " +
              "ประเมิน Head: " +
              head
          );
          form
            .addSectionHeaderItem()
            .setTitle(
              "5 = ดีมาก (Very Good) 4 = ดี (Good) 3 = ปานกลาง (Satisfactory) 2 = ต้องปรับปรุง (Needs Improvement) 1 = ต้องแก้ไขเร่งด่วน (Unsatisfactory)"
            );

          // Group 1: Performance
          form.addSectionHeaderItem().setTitle("ผลการทำงาน (Performance)");
          form
            .addScaleItem()
            .setTitle(
              head +
                "--" +
                "QY1--" +
                "ไม่สั่งงานมากไป ไม่น้อยไป สมเหตุสมผล (Balance workload)"
            )
            .setBounds(1, 5);

          // Group 2: Work Ethics
          form
            .addSectionHeaderItem()
            .setTitle("ข้อพึงปฏิบัติในการทำงาน (Work Ethics)");
          form
            .addScaleItem()
            .setTitle(head + "--" + "QY2--" + "สุภาพ อ่อนน้อม")
            .setBounds(1, 5);
          form
            .addScaleItem()
            .setTitle(
              head +
                "--" +
                "QY3--" +
                "การเริ่มและเลิกประชุมตรงต่อเวลา ,การบริหารเวลาและการประชุมให้มีประสิทธิภาพ"
            )
            .setBounds(1, 5);
          form
            .addScaleItem()
            .setTitle(head + "--" + "QY4--" + "การทำงานร่วมกับฝ่ายอื่น")
            .setBounds(1, 5);

          // Group 3: Leadership & Followership
          form
            .addSectionHeaderItem()
            .setTitle("ภาวะผู้นำและการเป็นผู้ตาม (Leadership & Followership)");
          form
            .addScaleItem()
            .setTitle(
              head +
                "--" +
                "QY5--" +
                "การนำทีมได้ดี และได้รับความเชื่อมั่นจากลูกทีม"
            )
            .setBounds(1, 5);
          form
            .addScaleItem()
            .setTitle(
              head +
                "--" +
                "QY6--" +
                "รับฟังอย่างตั้งใจ เห็นอกเห็นใจลูกทีม, เปิดโอกาสให้ทีมมีส่วนร่วมในการตัดสินใจ"
            )
            .setBounds(1, 5);
          form
            .addScaleItem()
            .setTitle(
              head + "--" + "QY7--" + "ร่วมมือร่วมแรงร่วมใจ ทํางานเป็นทีม"
            )
            .setBounds(1, 5);
          form
            .addScaleItem()
            .setTitle(
              head + "--" + "QY8--" + "ความสามารถในการจัดการความขัดแย้งภายในทีม"
            )
            .setBounds(1, 5);
          form
            .addScaleItem()
            .setTitle(
              head +
                "--" +
                "QY9--" +
                "ความชัดเจนในการให้คำแนะนำและการสื่อสารระหว่างทีม"
            )
            .setBounds(1, 5);

          // Group 4: Self-Development
          form
            .addSectionHeaderItem()
            .setTitle("การพัฒนาตนเอง (Self-Development)");
          form
            .addScaleItem()
            .setTitle(
              head +
                "--" +
                "QY10--" +
                "การนำ feedback จาก team reflection มาปรับปรุง"
            )
            .setBounds(1, 5);

          if (!part1Start) {
            part1Start = pageForHead;
          }
        });

        // Part 2: Assess Other Responsibilities (Responsibility to Responsibility)
        var part2Start = null;
        responsibilities.forEach(function (peer) {
          if (peer !== user) {
            var pageForPeer = form.addPageBreakItem();
            pageForPeer.setTitle(
              "รูปแบบการประเมิน: Operator ประเมิน Operator, " +
                "ประเมิน: " +
                peer
            );
            form.addSectionHeaderItem().setTitle("Friends Satisfaction");
            form
              .addSectionHeaderItem()
              .setTitle(
                "5 = รู้สึกว่าบุคคลนี้ให้ความสนับสนุนคุณตลอดเวลา และแม้จะเกิดความขัดแย้งก็เป็นความขัดแย้งที่เกิดประโยชน์, 1 = รู้สึกว่าบุคคลนี้ให้ความสนันสนุนคุณน้อย หรือมีความขัดแย้งที่ไม่จำเป็นบ่อยครั้ง"
              );
            form
              .addScaleItem()
              .setTitle(peer + "--" + "QZ1--" + "Friends Satisfaction")
              .setBounds(1, 5);
            if (!part2Start) {
              part2Start = pageForPeer;
            }
          }
        });

        // The branch for a responsibility user will start at the first page of Part 1.
        var userStart = part1Start;

        // Add a final page break that goes to submission.
        var finalPageResp = form.addPageBreakItem();
        finalPageResp.setTitle("Submit your responses");
        finalPageResp.setGoToPage(FormApp.PageNavigationType.SUBMIT);

        // Map this responsibility user to the beginning of their branch.
        userSections[user] = respBranchStart;
      }
    });

    // Set branching logic for the initial multiple-choice question.
    var choices = [];
    users.forEach(function (user) {
      choices.push(userQuestion.createChoice(user, userSections[user]));
    });
    userQuestion.setChoices(choices);

    // Set the sharing so that anyone with the link can access the form.
    var file = DriveApp.getFileById(form.getId());
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Write the generated form's published URL into Column F (FormLink).
    var formUrl = form.getPublishedUrl();
    sheet.getRange(i + 1, 6).setValue(formUrl);

    // Create a new response spreadsheet named exactly as the Project ID.
    var responseSpreadsheet = SpreadsheetApp.create(projectId);
    // Set the form's destination to the new response spreadsheet.
    form.setDestination(
      FormApp.DestinationType.SPREADSHEET,
      responseSpreadsheet.getId()
    );

    // Set the sharing so that anyone with the link can access the response spreadsheet.
    var sheetFile = DriveApp.getFileById(responseSpreadsheet.getId());
    sheetFile.setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.VIEW
    );

    // Write the response sheet URL into Column G (SheetLink).
    sheet.getRange(i + 1, 7).setValue(responseSpreadsheet.getUrl());
  }

  // Notify the user when processing is complete.
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Forms and response sheets generated and URLs saved!",
    "Done",
    5
  );
  Logger.log("Forms and response sheets generated.");
}
