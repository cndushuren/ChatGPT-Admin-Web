import client, {
  Prisma,
  type RegisterCode,
  type RegisterType,
  type InvitationCode,
} from "@caw/database";
import { generateRandomSixDigitNumber, generateRandomString } from "../utils";
import { dalErrorCatcher } from "../decorator";

/**
 * 一些码的管理，包括注册码、邀请码
 */
@dalErrorCatcher
export class CodeDAL {
  constructor() {}

  /**
   * Get verification code
   * @param register Verification Information
   */
  async getCode(register: string): Promise<RegisterCode | null> {
    return client.registerCode.findUnique({
      where: {
        register: register,
      },
    });
  }

  /**
   * 生成注册的有
   * @param type 注册类型
   * @param register 注册信息 手机号或邮箱地址
   * @return 返回过期的时间戳
   */
  async newCode({
    type,
    register,
  }: {
    type: RegisterType;
    register: string;
  }): Promise<{ expiredAt: number }> {
    const expiredTimeStamp = Date.now() + 600 * 1000 * 10;
    const code: Prisma.RegisterCodeCreateInput = {
      type: type,
      register: register,
      code: generateRandomSixDigitNumber(),
      expiredAt: new Date(expiredTimeStamp), // 默认十分钟
    };
    return { expiredAt: expiredTimeStamp };
  }

  /**
   * 检查验证码是否一致
   * @param register 注册信息
   * @param codeProvided 需要被验证的验证码
   * @return 验证码是否一致
   */
  async validationCode({
    register,
    codeProvided,
  }: {
    register: string;
    codeProvided: number;
  }): Promise<Boolean> {
    return this.getCode(register).then((code) => {
      return code ? code?.code === codeProvided : false;
    });
  }

  /**
   * 获取用户邀请码
   * @param userId 用户主键
   * @param createIfNull 当用户无邀请码时是否自动生成并返回
   */
  async getInvitationCode(
    userId: number,
    createIfNull: boolean = true
  ): Promise<InvitationCode[]> {
    const invitationCodes = await client.invitationCode.findMany({
      where: {
        ownerId: userId,
      },
    });
    if (invitationCodes.length === 0 && createIfNull) {
      return [
        await client.invitationCode.create({
          data: {
            code: generateRandomString(6),
            ownerId: userId,
          },
          include: {},
        }),
      ];
    }
    return invitationCodes;
  }
}
