const { ObjectId } = require("mongodb");
const db = require("../db.js"); // Importing db connection

module.exports = {
  addContentTitle: (courseId, contentData, callback) => {
    // Convert courseId to ObjectId
    courseId = new ObjectId(courseId);

    // Add courseId to contentData
    contentData.courseId = courseId;

    db.get()
      .collection("contents")
      .insertOne(contentData, (err, result) => {
        if (err) {
          console.error("Error adding content title:", err);
          callback(err, null);
        } else {
          callback(null, result.insertedId.toString());
        }
      });
  },
};
