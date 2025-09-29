import { Story } from "@prisma/client";
import { validator } from "../middlewares/validators";
import { db } from "../db/connect";
import { AuthenticatedRequest } from "../middlewares/authenticate";
import { Response } from "express";
import { HttpError } from "../utils/error";
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import path from "path"; // added import
import fs from "fs";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const createStory = validator.catchError(
  async (req: AuthenticatedRequest, res: Response) => {
    const { title } = req.body as Story;
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpError("Unauthorized", 401);
    }

    if (!req.file?.filename) {
      throw new HttpError("Audio file required", 400);
    }

    try {
      const story = await db.story.create({
        data: {
          userId,
          title,
          description: req.body?.description || "",
          audioFile: req.file.filename, // save binary data to DB
          createdAt: new Date(),
        },
      });

      // TODO: Call transcription API by streaming audioData or uploading independently

      res.status(201).json([story]);
    } catch (err) {
      throw new HttpError("Failed to create story and store audio", 500);
    }
  }
);

export const getStories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const stories = await db.story.findMany({
      where: { userId },
    });
    res.status(200).json(stories); // changed to 200
  } catch (error) {
    throw new HttpError("Failed to get stories", 500);
  }
};

export const transcribeStory = validator.catchError(
  async (req: AuthenticatedRequest, res: Response) => {
    const story_Id = String(req.body?.story_Id || "");
    if (!story_Id) {
      throw new HttpError("Invalid story id", 400);
    }

    const story = await db.story.findFirst({
      where: { id: story_Id, userId: req.user?.id },
    });
    if (!story) {
      throw new HttpError("Story not found", 404);
    }

    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/`;

    let transcribedText = (req.body?.transcription as string) || "";
    if (!transcribedText) {
      // Try to transcribe via AI
      try {
        const fileExt = story.audioFile.split(".")[1];
        const filePath = path.resolve(
          __dirname,
          "../../uploads/" + story.audioFile
        );

        const myfile = await ai.files.upload({
          file: filePath,
          config: { mimeType: `audio/${fileExt}` },
        });

        const contents = createUserContent([
          createPartFromUri(myfile.uri as string, `audio/${fileExt}`),
          `Transcribe the audio in language ${req.user?.language}. Your answer should be direct translation without any additional commentary.`,
        ]);
        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
        });
        // // fallback checks for different response shapes
        // transcribedText = result?.text || "";

        transcribedText = result.text || "";
      } catch (err) {
        throw new HttpError("Transcription service failed", 502);
      }
    }

    if (!transcribedText) {
      throw new HttpError("Transcription returned no text", 500);
    }

    const updated = await db.story.update({
      where: { id: story.id },
      data: { transcript: transcribedText },
    });
    return res.status(200).json(updated);
  }
);

export const translateStory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const story_Id = String(req.body?.story_Id || "");
  if (!story_Id) {
    throw new HttpError("Invalid story id", 400);
  }

  const story = await db.story.findFirst({
    where: { id: story_Id, userId: req.user?.id },
  });
  if (!story) {
    throw new HttpError("Story not found", 404);
  }

  let translatedText = (req.body?.translation as string) || "";
  if (!translatedText) {
    if (!story.transcript) {
      throw new HttpError("Transcription required for translation", 400);
    }

    try {
      const prompt = `Translate the following transcript from ${req.user?.language} to English: ${story.transcript}. Your answer should be direct translation without any additional commentary.`;
      const result: any = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      translatedText = result.text || "";
    } catch (err) {
      throw new HttpError("Translation service failed", 502);
    }
  }

  if (!translatedText) {
    throw new HttpError("Translation returned no text", 500);
  }

  const updated = await db.story.update({
    where: { id: story.id },
    data: { translation: translatedText },
  });
  return res.status(200).json(updated);
};
