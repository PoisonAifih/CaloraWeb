import { BadRequestException, Body, Controller, ForbiddenException, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user';
import { SessionGuard } from '../common/guards/session.guard';
import { AnalyzeService } from './analyze.service';

@Controller('api/analyze')
@UseGuards(SessionGuard)
export class AnalyzeController {
  constructor(private readonly analyze: AnalyzeService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async analyzeFood(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { text?: string; caption?: string; imageBase64?: string; mimeType?: string }
  ) {
    // Analysis runs on the owner's Claude plan, so anonymous guests cannot use it.
    if (user.role === 'GUEST') throw new ForbiddenException('Sign in with an account to analyze meals');
    try {
      if (file?.buffer) {
        return { ...await this.analyze.analyzeFoodPhoto(file.buffer, file.mimetype, body.caption || ''), source: 'PHOTO_ESTIMATE' };
      }
      if (body.imageBase64) {
        const buffer = Buffer.from(body.imageBase64, 'base64');
        return { ...await this.analyze.analyzeFoodPhoto(buffer, body.mimeType || 'image/jpeg', body.caption || ''), source: 'PHOTO_ESTIMATE' };
      }
      if (body.text) {
        return { ...await this.analyze.analyzeFoodText(body.text), source: 'TEXT_ESTIMATE' };
      }
      throw new BadRequestException('Provide an image or a food description');
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }
}
