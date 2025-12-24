import {
  createFromRawJson,
  CreateJsonOptions,
  JSONDocument,
} from "~/jsonDoc.client";
import convertFromRawXml from "./convertFromRawXml";

export default async function createFromRawXml(
  filename: string,
  contents: string,
  options?: CreateJsonOptions
): Promise<JSONDocument> {
  const jsonString: string = convertFromRawXml(contents);
  return createFromRawJson(filename, jsonString, options);
}