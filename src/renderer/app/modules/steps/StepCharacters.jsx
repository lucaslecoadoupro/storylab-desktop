import React from 'react';
import { Icon } from '../../icons.jsx';
import { Avatar, Callout, Empty, Seg, useConfirm } from '../../ui.jsx';
import { useStory, useToast } from '../../store.jsx';
import { contactId, usesOf } from '../../story/model.js';
import { CHARACTER_SUGGESTIONS } from '../../story/templates.js';
import { plural } from '../../utils.js';

const KINDS = [
  { value: 'person', label: 'Personne', icon: 'user' },
  { value: 'group', label: 'Groupe', icon: 'users2' },
  { value: 'service', label: 'Service', icon: 'phoneCall', title: 'Un numéro d’aide, une appli, un compte officiel…' },
];

/** Étape 2 — les personnages et les groupes de discussion. */
export function StepCharacters({ uid }) {
  const { story, edit } = useStory(uid);
  const confirm = useConfirm();
  const toast = useToast();
  const s = story.scenario;
  const chars = story.meta.characters || {};
  const list = Object.entries(s.contacts || {});

  const add = (name = 'Nouveau personnage', kind = 'person', role = '') => {
    let id;
    edit((st) => {
      id = contactId(st.scenario, name);
      st.scenario.contacts[id] = { name };
      st.meta.characters = { ...(st.meta.characters || {}), [id]: { kind, role } };
    });
    setTimeout(() => document.querySelector(`[data-contact="${id}"] input`)?.select(), 50);
  };
  const remove = async (id) => {
    const uses = usesOf(s, id);
    if (uses.length) {
      toast(`${s.contacts[id].name} apparaît dans ${plural(uses.length, 'scène')} : changez d’abord ces scènes.`, 'error', 5000);
      return;
    }
    if (!(await confirm({ title: 'Supprimer ce personnage ?', message: `${s.contacts[id].name} n’apparaît dans aucune scène.`, confirmLabel: 'Supprimer', danger: true }))) return;
    edit((st) => { delete st.scenario.contacts[id]; if (st.meta.characters) delete st.meta.characters[id]; });
  };

  return (
    <div className="step-grid">
      <div className="stack">
        <div className="card hero-card" data-tour="hero-card">
          <div className="card-body row" style={{ gap: '1rem', alignItems: 'flex-start' }}>
            <Avatar kind="me" size={46} />
            <div style={{ flex: 1 }}>
              <div className="slab" style={{ fontWeight: 800, fontSize: '1.02rem' }}>Le héros, c’est l’élève</div>
              <p className="muted" style={{ fontSize: '.84rem', marginTop: '.2rem' }}>
                Il tient le téléphone : il lit les messages qu’il reçoit et répond par ses choix. Dans le téléphone, ses messages apparaissent à droite.
                Vous pouvez lui donner un prénom dans les récits (« Tu es Noa, élève de 4e… »), mais ce n’est pas obligatoire.
              </p>
            </div>
          </div>
        </div>

        <div className="card" data-tour="characters">
          <div className="card-hd">
            <div className="card-title"><Icon name="users" />Les autres personnages</div>
            <button className="btn btn-primary btn-sm" onClick={() => add()}><Icon name="plus" />Ajouter un personnage</button>
          </div>
          {list.length === 0 ? (
            <Empty icon="users" title="Aucun personnage pour l’instant" sub="Ajoutez les amis, les parents, le groupe de la classe… Ils pourront écrire, publier ou appeler." />
          ) : (
            <div className="char-list">
              {list.map(([id, c]) => {
                const meta = chars[id] || { kind: 'person', role: '' };
                const n = usesOf(s, id).length;
                return (
                  <div className="char-row" key={id} data-contact={id}>
                    <Avatar name={c.name} kind={meta.kind === 'group' ? 'group' : undefined} size={40} />
                    <div className="char-main">
                      <input className="input char-name" value={c.name} aria-label="Nom du personnage" onChange={(e) => edit((st) => { st.scenario.contacts[id].name = e.target.value; }, `cn-${id}`)} />
                      <input className="input input-sm" value={meta.role} placeholder="Qui est-ce ? (pour vous) ex. meilleure amie, élève discret…" onChange={(e) => edit((st) => { st.meta.characters = { ...(st.meta.characters || {}) }; st.meta.characters[id] = { ...meta, role: e.target.value }; }, `cr-${id}`)} />
                    </div>
                    <Seg size="sm" value={meta.kind} onChange={(k) => edit((st) => { st.meta.characters = { ...(st.meta.characters || {}) }; st.meta.characters[id] = { ...meta, kind: k }; })} options={KINDS} />
                    <span className="pill" title="Nombre de scènes où ce personnage apparaît">{n ? plural(n, 'scène') : 'pas encore utilisé'}</span>
                    <button className="btn btn-quiet btn-icon btn-sm" onClick={() => remove(id)} aria-label={`Supprimer ${c.name}`}><Icon name="trash" /></button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="card-body suggest">
            <span className="field-label">Ajouter en un clic</span>
            <div className="chips">
              {CHARACTER_SUGGESTIONS.filter((x) => !list.some(([, c]) => c.name === x.name)).map((x) => (
                <button key={x.name} type="button" className="chip" onClick={() => add(x.name, x.kind, x.role)}><Icon name="plus" />{x.name}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <aside className="stack side-tips">
        <Callout title="Groupes de discussion" icon="users2">
          Un <b>groupe</b> (ex. « Les 4e B ») est une conversation à plusieurs. Dans un groupe, chaque message est écrit par un personnage : créez aussi les membres qui parlent.
        </Callout>
        <Callout title="Renommer sans risque" icon="edit">
          Changer un nom ici le change partout dans l’histoire, y compris dans les messages déjà écrits.
        </Callout>
        <Callout title="Des prénoms fictifs" icon="lock" tone="success">
          Évitez les prénoms d’élèves de vos classes et les noms de vraies personnes.
        </Callout>
      </aside>
    </div>
  );
}
