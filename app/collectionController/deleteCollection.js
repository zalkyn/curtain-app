import prisma from "../db.server";

export const DeleteCollection = async (formData) => {
  try {
    const data = JSON.parse(formData.get("data"));
    await prisma.collection.deleteMany({
      where: { id: data?.id },
    });
    return null;
  } catch (error) {
    console.log("Delete collection error", error);
    return null;
  }
};
