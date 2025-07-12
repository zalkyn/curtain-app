import prisma from "../db.server";

export const CreateNewCollection = async (formData) => {
  try {
    const data = JSON.parse(formData.get("data"));
    await prisma.collection.create({ data });
    return null;
  } catch (error) {
    console.log("Create new collection error", error);
    return null;
  }
};
