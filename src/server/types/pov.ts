const PovFile = {
  id: String,
  projectId: String,
  name: String,
  content: String,
  createdAt: String,
  updatedAt: String,
  metadata: {
    duration: Number,
    numberOfNodes: Number
  }
};

const PovMetadata = {
  id: String,
  projectId: String,
  name: String,
  createdAt: String,
  updatedAt: String,
  metadata: {
    duration: Number,
    numberOfNodes: Number
  }
};

module.exports = { PovFile, PovMetadata };
