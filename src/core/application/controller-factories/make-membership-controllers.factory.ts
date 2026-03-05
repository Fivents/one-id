import {
  makeAddMemberUseCase,
  makeGetMemberUseCase,
  makeListMembersUseCase,
  makeRemoveMemberUseCase,
  makeUpdateMemberRoleUseCase,
} from '@/core/infrastructure/factories';

import {
  AddMemberController,
  GetMemberController,
  ListMembersController,
  RemoveMemberController,
  UpdateMemberRoleController,
} from '../controllers/membership';

export function makeAddMemberController(): AddMemberController {
  return new AddMemberController(makeAddMemberUseCase());
}

export function makeGetMemberController(): GetMemberController {
  return new GetMemberController(makeGetMemberUseCase());
}

export function makeUpdateMemberRoleController(): UpdateMemberRoleController {
  return new UpdateMemberRoleController(makeUpdateMemberRoleUseCase());
}

export function makeListMembersController(): ListMembersController {
  return new ListMembersController(makeListMembersUseCase());
}

export function makeRemoveMemberController(): RemoveMemberController {
  return new RemoveMemberController(makeRemoveMemberUseCase());
}
