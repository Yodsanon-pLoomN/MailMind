const draftService = require('../services/draft.service');

// 1. สั่ง AI ร่างอีเมล
exports.generateDraftOnDemand = async (req, res) => {
  try {
    const { threadId } = req.body; // ลบ messageId ออกได้ถ้าใน Service ไม่ได้ใช้
    const userId = req.user.id;

    const result = await draftService.generateDraft(userId, threadId);
    res.json(result);

  } catch (error) {
    console.error('Draft Generation Error:', error.message);
    res.status(error.message.includes('กรุณาตั้งค่า') ? 400 : 500).json({ 
      error: error.message || 'เกิดข้อผิดพลาดในการให้ AI สร้างข้อความร่าง' 
    });
  }
};

// 2. อนุมัติและส่งอีเมล
exports.approveAndSendDraft = async (req, res) => {
  try {
    const { id: draftId } = req.params;
    const { editedReply } = req.body; 
    const userId = req.user.id;

    const result = await draftService.approveAndSend(userId, draftId, editedReply);
    res.json(result);

  } catch (error) {
    console.error("Send Action Error:", error.message);
    res.status(error.message === "ไม่พบ Draft นี้" ? 404 : 500).json({ error: error.message });
  }
};

// 3. ดึงรายการ Draft ทั้งหมด
exports.getDrafts = async (req, res) => {
  try {
    const drafts = await draftService.getUserDrafts(req.user.id);
    res.json(drafts);
  } catch (error) {
    console.error("Get Drafts Error:", error);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูล Draft ได้" });
  }
};

// 4. ยกเลิก Draft
exports.rejectDraft = async (req, res) => {
  try {
    const { id: draftId } = req.params;
    const result = await draftService.rejectDraft(req.user.id, draftId);
    res.json(result);
  } catch (error) {
    console.error("Reject Draft Error:", error);
    res.status(500).json({ error: "ไม่สามารถยกเลิก Draft ได้" });
  }
};