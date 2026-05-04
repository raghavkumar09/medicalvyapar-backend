import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import shopService from "./shop.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

class ShopController {
  // ── Shop ────────────────────────────────────────────────

  createShop = asyncHandler(async (req: AuthRequest, res: Response) => {
    const shop = await shopService.createShop(req.user!.id, req.body);
    res.status(201).json(ApiResponse.created(shop));
  });

  getMyShops = asyncHandler(async (req: AuthRequest, res: Response) => {
    const shops = await shopService.getOwnerShops(req.user!.id);
    res.status(200).json(ApiResponse.ok(shops, "Shops retrieved"));
  });

  getShop = asyncHandler(async (req: AuthRequest, res: Response) => {
    const shop = await shopService.getShopById(req.params.shopId as string, req.user!.id);
    res.status(200).json(ApiResponse.ok(shop));
  });

  updateShop = asyncHandler(async (req: AuthRequest, res: Response) => {
    const shop = await shopService.updateShop(req.params.shopId as string, req.user!.id, req.body);
    res.status(200).json(ApiResponse.ok(shop, "Shop updated"));
  });

  deleteShop = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await shopService.deleteShop(req.params.shopId as string, req.user!.id);
    res.status(200).json(ApiResponse.ok(result));
  });

  // ── Staff ───────────────────────────────────────────────

  addStaff = asyncHandler(async (req: AuthRequest, res: Response) => {
    const staff = await shopService.addStaff(req.params.shopId as string, req.user!.id, req.body);
    res.status(201).json(ApiResponse.created(staff, "Staff added"));
  });

  getStaff = asyncHandler(async (req: AuthRequest, res: Response) => {
    const staff = await shopService.getShopStaff(req.params.shopId as string, req.user!.id);
    res.status(200).json(ApiResponse.ok(staff, "Staff retrieved"));
  });

  updateStaff = asyncHandler(async (req: AuthRequest, res: Response) => {
    const staff = await shopService.updateStaff(req.params.staffId as string, req.user!.id, req.body);
    res.status(200).json(ApiResponse.ok(staff, "Staff updated"));
  });

  deleteStaff = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await shopService.deleteStaff(req.params.staffId as string, req.user!.id);
    res.status(200).json(ApiResponse.ok(result));
  });
}

const shopController = new ShopController();
export default shopController;
