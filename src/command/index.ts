import type { Command } from '../types';
import { colourCommand } from './colour';
import { descriptionCommand, descriptionsCommand } from './description';
import { emoteCommand } from './emote';
import { helpCommand } from './help';
import { bootCommand, inviteCommand } from './invite';
import { moveInCommand, moveOutCommand } from './move';
import { renameCommand } from './name';
import { nsfwCommand } from './nsfw';

export const commands: Command[] = [
  colourCommand,
  descriptionCommand,
  descriptionsCommand,
  emoteCommand,
  helpCommand,
  inviteCommand,
  bootCommand,
  moveInCommand,
  moveOutCommand,
  renameCommand,
  nsfwCommand,
];
