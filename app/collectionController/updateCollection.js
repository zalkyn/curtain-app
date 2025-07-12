import prisma from "../db.server";

export const UpdateCollection = async (formData) => {
  try {
    const data = JSON.parse(formData.get("data"));
    await prisma.collection.updateMany({
      where: { id: data?.id },
      data: {
        title: data?.title,
        handle: data?.handle,
        shortInfo: data?.shortInfo,
        activeStatus: data?.activeStatus,
      },
    });
    return null;
  } catch (error) {
    console.log("Update collection error", error);
    return null;
  }
};
