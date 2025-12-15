const StudentSchema = require('../models/CoreUser/Student');
const ParentSchema = require('../models/CoreUser/Parent');
const db = require('../config/db');

/**
 * Add a student to a parent's children array
 * @param {string} parentId - Parent's ObjectId
 * @param {string} studentId - Student's ObjectId
 * @param {string} userId - Admin's ObjectId
 */
const addStudentToParent = async (userId,parentId, studentId) => {
  try {

    const {connection} = await db.getUserSpecificConnection(userId);
    const ParentModel = connection.model('Parent', ParentSchema);
    await ParentModel.findByIdAndUpdate(
      parentId,
      { 
        $addToSet: { children: studentId },
        $inc: { childrenCount: 1 }
      },
      { new: true }
    );
  } catch (error) {
    console.error('Error adding student to parent:', error);
    throw error;
  }
};

/**
 * Remove a student from a parent's children array
 * @param {string} parentId - Parent's ObjectId
 * @param {string} studentId - Student's ObjectId
 * @param {string} userId - Admin's ObjectId
 */
const removeStudentFromParent = async (userId,parentId, studentId) => {
  try {
    const {connection} = await db.getUserSpecificConnection(userId);
    const ParentModel = connection.model('Parent', ParentSchema);
    await ParentModel.findByIdAndUpdate(
      parentId,
      { 
        $pull: { children: studentId },
        $inc: { childrenCount: -1 }
      },
      { new: true }
    );
  } catch (error) {
    console.error('Error removing student from parent:', error);
    throw error;
  }
};

/**
 * Update parent-child relationships when student's parents change
 * @param {string} studentId - Student's ObjectId
 * @param {Array} newParentIds - Array of new parent ObjectIds
 * @param {string} userId - Admin's ObjectId
 */
const updateStudentParents = async (userId,studentId, newParentIds) => {
  try {
    const {connection} = await db.getUserSpecificConnection(userId);
    const StudentModel = connection.model('Student', StudentSchema);
    // Get current student to find old parents
    const student = await StudentModel.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    const oldParentIds = student.parent_id || [];

    // Remove student from old parents
    for (const oldParentId of oldParentIds) {
      if (oldParentId && !newParentIds.includes(oldParentId.toString())) {
        await removeStudentFromParent(userId, oldParentId, studentId);
      }
    }

    // Add student to new parents
    for (const newParentId of newParentIds) {
      if (newParentId && !oldParentIds.includes(newParentId.toString())) {
        await addStudentToParent(userId, newParentId, studentId);
      }
    }
  } catch (error) {
    console.error('Error updating student parents:', error);
    throw error;
  }
};

/**
 * Get all students for a parent with populated data
 * @param {string} parentId - Parent's ObjectId
 * @returns {Array} Array of student objects
 * @param {string} userId - Admin's ObjectId
 */
const getParentStudents = async (userId,parentId) => {
  try {
    const {connection} = await db.getUserSpecificConnection(userId);
    const ParentModel = connection.model('Parent', ParentSchema);
    const parent = await ParentModel.findById(parentId).populate({
      path: 'children',
      select: 'full_name admission_number class_id email contact status'
    });
    return parent ? parent.children : [];
  } catch (error) {
    console.error('Error getting parent students:', error);
    throw error;
  }
};

/**
 * Get all parents for a student with populated data
 * @param {string} studentId - Student's ObjectId
 * @returns {Array} Array of parent objects
 * @param {string} userId - Admin's ObjectId
 */
const getStudentParents = async (userId,studentId) => {
  try {
    const {connection} = await db.getUserSpecificConnection(userId);
    const StudentModel = connection.model('Student', StudentSchema);
    const student = await StudentModel.findById(studentId).populate({
      path: 'parent_id',
      select: 'full_name email phone address'
    });
    return student ? student.parent_id : [];
  } catch (error) {
    console.error('Error getting student parents:', error);
    throw error;
  }
};

module.exports = {
  addStudentToParent,
  removeStudentFromParent,
  updateStudentParents,
  getParentStudents,
  getStudentParents
};