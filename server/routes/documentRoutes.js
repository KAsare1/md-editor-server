const express = require('express');
const documentController = require('../controllers/documentController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();



router.post('/', authenticate, documentController.createDocument);


router.get("/:docId", authenticate, documentController.getDocumentById);
router.get('/', authenticate, documentController.getUserDocuments);


router.post('/:docId/invite', authenticate, documentController.inviteCollaborator);

module.exports = router;
