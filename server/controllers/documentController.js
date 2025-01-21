const Document = require('../models/Document');
const User = require('../models/user');



// Get a single document by ID
const getDocumentById = async (req, res) => {
  const { docId } = req.params;

  try {
    // Find the document by ID
    const document = await Document.findById(docId).populate("createdBy", "name email").populate("collaborators", "name email");

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    // Check if the authenticated user is the creator or a collaborator
    const userId = req.auth._id;
    const isAuthorized =
      document.createdBy._id.toString() === userId || 
      document.collaborators.some((collaborator) => collaborator._id.toString() === userId);

    if (!isAuthorized) {
      return res.status(403).json({ message: "Access denied. You are not authorized to view this document." });
    }

    res.status(200).json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong while retrieving the document." });
  }
};



// Get all documents for the authenticated user
const getUserDocuments = async (req, res) => {
  console.log(req);
  try {
    if (!req.auth || !req.auth._id) {
      return res.status(401).json({ message: 'Unauthorized: No user ID found' });
    }

    const user = await User.findById(req.auth._id).populate('documents');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Invite a collaborator to a document
const inviteCollaborator = async (req, res) => {
  const { docId } = req.params;
  const { collaboratorEmail } = req.body;

  try {
    const document = await Document.findById(docId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const collaborator = await User.findOne({ email: collaboratorEmail });
    if (!collaborator) {
      return res.status(404).json({ message: 'User not found' });
    }

    document.collaborators.push(collaborator._id);
    await document.save();

    collaborator.documents.push(document._id);
    await collaborator.save();

    res.status(200).json({ message: 'Collaborator invited successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



const createDocument = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.auth._id;  

    if (!title) {
      return res.status(400).json({ message: 'Title required.' });
    }

    const newDocument = new Document({
      title,
      content,
      createdBy: userId,  // Set the userId for document creator
    });

    await newDocument.save();

    // Associate this document with the user's document array
    const user = await User.findById(userId);
    user.documents.push(newDocument._id);
    await user.save();

    return res.status(201).json(newDocument);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong while creating the document.' });
  }
};


module.exports = {
  getDocumentById,
  getUserDocuments,
  inviteCollaborator,
  createDocument,
};
