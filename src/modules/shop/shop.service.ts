import shopRepository from "./shop.repository.js";
import { ApiError } from "../../utils/ApiError.js";
import { hashPassword } from "../../utils/helpers.js";
import logger from "../../utils/logger.js";
import type { CreateShopInput, UpdateShopInput, CreateStaffInput, UpdateStaffInput } from "../../utils/validators.js";

export class ShopService {
  // ── Shop CRUD ───────────────────────────────────────────

  async createShop(ownerId: string, data: CreateShopInput) {
    const shop = await shopRepository.create({
      ...data,
      owner: { connect: { id: ownerId } },
    });

    logger.info(`Shop created: ${shop.id} by owner ${ownerId}`);
    return shop;
  }

  async getOwnerShops(ownerId: string) {
    return shopRepository.findByOwnerId(ownerId);
  }

  async getShopById(shopId: string, ownerId: string) {
    const shop = await shopRepository.findById(shopId);
    if (!shop) {
      throw ApiError.notFound("Shop not found");
    }
    if (shop.ownerId !== ownerId) {
      throw ApiError.forbidden("You don't have access to this shop");
    }
    return shop;
  }

  async updateShop(shopId: string, ownerId: string, data: UpdateShopInput) {
    const shop = await shopRepository.findById(shopId);
    if (!shop) throw ApiError.notFound("Shop not found");
    if (shop.ownerId !== ownerId) throw ApiError.forbidden("Access denied");

    return shopRepository.update(shopId, data);
  }

  async deleteShop(shopId: string, ownerId: string) {
    const shop = await shopRepository.findById(shopId);
    if (!shop) throw ApiError.notFound("Shop not found");
    if (shop.ownerId !== ownerId) throw ApiError.forbidden("Access denied");

    await shopRepository.delete(shopId);
    logger.info(`Shop deleted: ${shopId} by owner ${ownerId}`);
    return { message: "Shop deleted successfully" };
  }

  // ── Staff Management ────────────────────────────────────

  async addStaff(shopId: string, ownerId: string, data: CreateStaffInput) {
    // Verify shop ownership
    const shop = await shopRepository.findById(shopId);
    if (!shop) throw ApiError.notFound("Shop not found");
    if (shop.ownerId !== ownerId) throw ApiError.forbidden("Access denied");

    // Check if staff with same mobile already exists in this shop
    const existing = await shopRepository.findStaffByMobileAndShop(data.mobileNo, shopId);
    if (existing) {
      throw ApiError.conflict("Staff member with this mobile already exists in this shop");
    }

    const hashedPassword = await hashPassword(data.password);

    const staff = await shopRepository.createStaff({
      name: data.name,
      mobileNo: data.mobileNo,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      shop: { connect: { id: shopId } },
    });

    logger.info(`Staff added: ${staff.id} to shop ${shopId}`);

    return {
      id: staff.id,
      name: staff.name,
      mobileNo: staff.mobileNo,
      role: staff.role,
    };
  }

  async getShopStaff(shopId: string, ownerId: string) {
    const shop = await shopRepository.findById(shopId);
    if (!shop) throw ApiError.notFound("Shop not found");
    if (shop.ownerId !== ownerId) throw ApiError.forbidden("Access denied");

    return shopRepository.findStaffByShopId(shopId);
  }

  async updateStaff(staffId: string, ownerId: string, data: UpdateStaffInput) {
    const staff = await shopRepository.findStaffById(staffId);
    if (!staff) throw ApiError.notFound("Staff not found");

    // Verify ownership through shop
    const shop = await shopRepository.findById(staff.shopId);
    if (!shop || shop.ownerId !== ownerId) throw ApiError.forbidden("Access denied");

    return shopRepository.updateStaff(staffId, data);
  }

  async deleteStaff(staffId: string, ownerId: string) {
    const staff = await shopRepository.findStaffById(staffId);
    if (!staff) throw ApiError.notFound("Staff not found");

    const shop = await shopRepository.findById(staff.shopId);
    if (!shop || shop.ownerId !== ownerId) throw ApiError.forbidden("Access denied");

    await shopRepository.deleteStaff(staffId);
    logger.info(`Staff removed: ${staffId} by owner ${ownerId}`);
    return { message: "Staff removed successfully" };
  }
}

const shopService = new ShopService();
export default shopService;
