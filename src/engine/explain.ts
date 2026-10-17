import type {DuelState,LegalAction} from './model';
/** These are authored explanations, not inferred rules or a card-text parser. */
export function explainLegalAction(action:LegalAction,state:DuelState):string{
 switch(action.type){
  case 'NORMAL_SUMMON':return action.position==='faceDownDefense'?'A Normal Set puts this monster face-down in Defense Position and uses your turn’s Normal Summon/Set.':'A Normal Summon places this monster face-up in Attack Position and uses your turn’s Normal Summon/Set.';
  case 'TRIBUTE_SUMMON':return 'The engine selected legal tribute material(s) and an empty Monster Zone; this action uses the Normal Summon/Set for the turn.';
  case 'FLIP_SUMMON':return 'This face-down monster is eligible to be Flip Summoned face-up into Attack Position.';
  case 'CHANGE_POSITION':return 'The monster is eligible to change its battle position manually this turn.';
  case 'ACTIVATE_BOOK_OF_MOON':return 'Book of Moon is a Quick-Play Spell. This legal choice targets a face-up monster and changes it to face-down Defense Position when its effect resolves.';
  case 'ACTIVATE_MST':return 'Mystical Space Typhoon targets a Spell/Trap; destroying the card does not automatically negate an already activated effect.';
  case 'DECLARE_ATTACK':return 'The selected monster is allowed to declare this attack in the current Battle Phase.';
  case 'PASS_CHAIN':return 'You are passing your opportunity to add another supported response to the open chain.';
  case 'RESOLVE_CHAIN':return 'Both players have passed their available chain responses. The engine resolves the chain in reverse order.';
  case 'ACTIVATE_DD_WARRIOR_LADY':return 'After damage calculation, this optional effect can banish both battling monsters. Battle damage has already been calculated.';
  case 'DECLINE_DD_WARRIOR_LADY':return 'You can decline this optional effect, allowing normal battle processing to continue.';
  case 'ACTIVATE_TRIGGER':return 'The engine has detected this trigger and is offering the supported legal resolution choices.';
  case 'DECLINE_PENDING_TRIGGER':return 'This effect is optional, so you can choose not to activate it.';
  case 'ADVANCE_DAMAGE_STEP':return `The engine is moving to the next implemented Damage Step checkpoint from ${state.pendingAttack?.damageStep??'the current point'}.`;
  case 'ADVANCE':return `Advance from the ${state.phase.replace('_',' ')} phase when no supported effect currently blocks progression.`;
  case 'DRAW_PHASE':return 'Draw for this turn according to the selected GOAT ruleset.';
  default:return 'The rules engine currently offers this action as legal in the present game state. Historical interactions not implemented by the prototype may still require review.';
 }
}
