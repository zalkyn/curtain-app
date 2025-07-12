import prisma from "../../../db.server"

export const appUninstalled = async (admin, session, shop) => {
    try {
        if (session) {
            await prisma.session.deleteMany({
                where: {
                    shop: shop
                }
            })
        }
        console.log('app successfully uninstalled from-----------', shop)
    } catch (err) {
        console.log("app uninstall webhook error-----------")
    }
}