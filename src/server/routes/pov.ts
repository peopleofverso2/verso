const express = require('express');
const { z } = require('zod');
const { PovService } = require('../services/PovService');
import { LoggingService } from '../../services/LoggingService';

const router = express.Router();
const povService = PovService.getInstance();
const logger = LoggingService.getInstance();

// Validation schemas
const povFileSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  content: z.string(),
  metadata: z.object({
    duration: z.number().optional(),
    numberOfNodes: z.number().optional()
  }).optional()
});

// GET /pov/:id - Get a POV file
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const povFile = await povService.getPovFile(id);

    if (!povFile) {
      return res.status(404).json({
        success: false,
        message: 'POV file not found'
      });
    }

    res.json({
      success: true,
      data: povFile
    });
  } catch (error) {
    logger.error('Error getting POV file', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /pov/metadata/:id - Get POV metadata
router.get('/metadata/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const metadata = await povService.getPovMetadata(id);

    if (!metadata) {
      return res.status(404).json({
        success: false,
        message: 'POV file not found'
      });
    }

    res.json({
      success: true,
      data: metadata
    });
  } catch (error) {
    logger.error('Error getting POV metadata', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /pov/project/:projectId - List POV files for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const povFiles = await povService.listPovFiles(projectId);

    res.json({
      success: true,
      data: povFiles
    });
  } catch (error) {
    logger.error('Error listing POV files', { error, projectId: req.params.projectId });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /pov - Create or update a POV file
router.post('/', async (req, res) => {
  try {
    const povFile = povFileSchema.parse(req.body);
    const savedFile = await povService.savePovFile(povFile);

    res.status(201).json({
      success: true,
      data: savedFile
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: error.errors
      });
    }

    logger.error('Error saving POV file', { error });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /pov/:id - Delete a POV file
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await povService.deletePovFile(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'POV file not found'
      });
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting POV file', { error, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
