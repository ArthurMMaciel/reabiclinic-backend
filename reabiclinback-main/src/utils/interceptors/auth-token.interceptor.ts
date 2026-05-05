import { CallHandler, ExecutionContext, NestInterceptor, UnauthorizedException } from "@nestjs/common";
import { Observable } from "rxjs";

export class AuthTokenInterceptor implements NestInterceptor {
    async intercept(context: ExecutionContext, next: CallHandler<any>) {
        const request = context.switchToHttp().getRequest();
        const token = request.headers.authorization?.split(' ')[1];
        if(!token) {
            throw new UnauthorizedException('Usuário não logado');
        }
        return next.handle();
    }
}