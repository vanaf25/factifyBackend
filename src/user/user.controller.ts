import { UserService } from './user.service';
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserDetails } from './user-details.interface';
import { JwtGuard } from "../auth/guards/jwt.guard";
import { GetUser } from "../auth/decorators/get-user-decorator";
import { UpdatePasswordDto } from "./dtos/update-password.dto";
import { Cron } from "@nestjs/schedule";
import { RolesGuard } from "../auth/guards/role.guard";

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
    @Get("/all")
    @UseGuards(JwtGuard,RolesGuard)
    getAllUsers(){
    return this.userService.getAllUsers()
    }
  @Get('/')
  @UseGuards(JwtGuard)
  getUserDetails(@GetUser() user:any){
    return  this.userService.getBasicUser(user.id)
  }
  @Patch("/password")
  @UseGuards(JwtGuard)
  updateUser(@Body() updatePasswordDto:UpdatePasswordDto,@GetUser() {id}:any ){
    return this.userService.updatePassword(id,updatePasswordDto)
  }
  @UseGuards(JwtGuard)
  @Get('/history')
  getHistory(@GetUser() user:any){
  return this.userService.getHistory(user.id)
  }
  @Post('/favoriteFacts/:factId')
  @UseGuards(JwtGuard)
  async addFavorite(@GetUser() user, @Param('factId') factId: string) {
    await this.userService.addFavorite(user.id, factId);
    return { message: 'Fact added to favorites' };
  }

  @UseGuards(JwtGuard)
  @Delete('/favoriteFacts/:factId')
  async removeFavorite(@GetUser() user, @Param('factId') factId: string) {
    await this.userService.removeFavorite(user.id, factId);
    return { message: 'Fact removed from favorites' };
  }
  @Get("/favoriteFacts")
  @UseGuards(JwtGuard)
  async getFavoriteFacts(@GetUser() user:any ) {
    const favoriteFacts = await this.userService.getFavoriteFacts(user.id);
    return favoriteFacts;
  }
  @Post('request-reset-password')
  async requestPasswordReset(@Body('email') email: string) {
    await this.userService.requestPasswordReset(email);
    return { message: 'Password reset link sent to email' };
  }

  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    await this.userService.resetPassword(token, newPassword);
    return { message: 'Password reset successful' };
  }
  @Get(':id')
  getUser(@Param('id') id: string): Promise<UserDetails | null> {
    return this.userService.findById(id);
  }
  @Cron('0 0 1 * *')
  async handleCron() {
    await this.userService.creditsBasedOnSubscriptionDate();
  }
}
