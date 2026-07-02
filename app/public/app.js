const root = document.getElementById('root');

const api = async (method, path, body) => {
  const response = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.error || `Request failed (${response.status})`);
  return data;
};

const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) if (child) node.appendChild(child);
  return node;
};

const state = { email: null, pendingEmail: null };

const renderTopbar = () =>
  el('header', { class: 'topbar' }, [
    el('div', { class: 'brand', 'data-testid': 'brand' }, [
      el('span', { class: 'brand-mark', text: 'FB' }),
      el('span', { text: 'FlowBoard' })
    ]),
    state.email &&
      el('div', { class: 'user-chip' }, [
        el('span', { 'data-testid': 'user-email', text: state.email }),
        el('button', {
          class: 'btn-ghost',
          'data-testid': 'logout-button',
          text: 'Log out',
          onclick: async () => {
            await api('POST', '/api/auth/logout');
            state.email = null;
            renderLogin();
          }
        })
      ])
  ]);

const errorBanner = message =>
  el('div', {
    class: 'error-banner',
    'data-testid': 'error-banner',
    role: 'alert',
    text: message
  });

function renderLogin(error) {
  root.replaceChildren(
    renderTopbar(),
    el('div', { class: 'auth-card', 'data-testid': 'auth-container' }, [
      el('h1', { text: 'Welcome back' }),
      el('p', {
        class: 'subtitle',
        text: 'Sign in with your email to continue.'
      }),
      error && errorBanner(error),
      el(
        'form',
        {
          'data-testid': 'login-form',
          onsubmit: async event => {
            event.preventDefault();
            const email = event.target.elements.email.value.trim();
            try {
              await api('POST', '/api/auth/request-code', { email });
              state.pendingEmail = email;
              renderOtp();
            } catch (err) {
              renderLogin(err.message);
            }
          }
        },
        [
          el('div', { class: 'field' }, [
            el('label', { for: 'email', text: 'Email address' }),
            el('input', {
              type: 'email',
              id: 'email',
              name: 'email',
              required: 'true',
              placeholder: 'you@company.com',
              'data-testid': 'email-input'
            })
          ]),
          el('button', {
            type: 'submit',
            class: 'btn-primary',
            'data-testid': 'request-code-button',
            text: 'Send sign-in code'
          })
        ]
      )
    ])
  );
}

function renderOtp(error) {
  root.replaceChildren(
    renderTopbar(),
    el('div', { class: 'auth-card', 'data-testid': 'otp-container' }, [
      el('h1', { text: 'Check your inbox' }),
      el('p', {
        class: 'subtitle',
        text: `We sent a 6-character code to ${state.pendingEmail}.`
      }),
      error && errorBanner(error),
      el(
        'form',
        {
          'data-testid': 'otp-form',
          onsubmit: async event => {
            event.preventDefault();
            const code = event.target.elements.code.value.trim().toUpperCase();
            try {
              await api('POST', '/api/auth/verify-code', {
                email: state.pendingEmail,
                code
              });
              state.email = state.pendingEmail;
              state.pendingEmail = null;
              await renderDashboard();
            } catch (err) {
              renderOtp(err.message);
            }
          }
        },
        [
          el('div', { class: 'field' }, [
            el('label', { for: 'code', text: 'Sign-in code' }),
            el('input', {
              type: 'text',
              id: 'code',
              name: 'code',
              required: 'true',
              maxlength: '6',
              autocomplete: 'one-time-code',
              placeholder: 'ABC123',
              'data-testid': 'otp-input'
            })
          ]),
          el('button', {
            type: 'submit',
            class: 'btn-primary',
            'data-testid': 'verify-code-button',
            text: 'Verify and sign in'
          })
        ]
      ),
      el('p', {
        class: 'otp-hint',
        text: 'Demo mode: no email is sent — the code is available via the test-only API.'
      })
    ])
  );
}

function projectModal(onCreated) {
  const backdrop = el(
    'div',
    { class: 'modal-backdrop', 'data-testid': 'project-modal' },
    [
      el('div', { class: 'modal' }, [
        el('h2', { text: 'New project' }),
        el(
          'form',
          {
            'data-testid': 'project-form',
            onsubmit: async event => {
              event.preventDefault();
              const name = event.target.elements.name.value;
              const description = event.target.elements.description.value;
              try {
                await api('POST', '/api/projects', { name, description });
                backdrop.remove();
                await onCreated();
              } catch (err) {
                alert(err.message);
              }
            }
          },
          [
            el('div', { class: 'field' }, [
              el('label', { for: 'project-name', text: 'Project name' }),
              el('input', {
                type: 'text',
                id: 'project-name',
                name: 'name',
                required: 'true',
                'data-testid': 'project-name-input'
              })
            ]),
            el('div', { class: 'field' }, [
              el('label', { for: 'project-description', text: 'Description' }),
              el('input', {
                type: 'text',
                id: 'project-description',
                name: 'description',
                'data-testid': 'project-description-input'
              })
            ]),
            el('div', { class: 'modal-actions' }, [
              el('button', {
                type: 'button',
                class: 'btn-secondary',
                text: 'Cancel',
                onclick: () => backdrop.remove()
              }),
              el('button', {
                type: 'submit',
                class: 'btn-primary',
                'data-testid': 'project-submit-button',
                text: 'Create project'
              })
            ])
          ]
        )
      ])
    ]
  );
  return backdrop;
}

async function renderDashboard() {
  const { projects } = await api('GET', '/api/projects');
  root.replaceChildren(
    renderTopbar(),
    el('main', { class: 'container', 'data-testid': 'dashboard' }, [
      el('div', { class: 'page-header' }, [
        el('h1', { text: 'Projects' }),
        el('button', {
          class: 'btn-primary',
          'data-testid': 'new-project-button',
          text: '+ New project',
          onclick: () => root.appendChild(projectModal(renderDashboard))
        })
      ]),
      projects.length === 0
        ? el(
            'div',
            { class: 'empty-state', 'data-testid': 'projects-empty-state' },
            [
              el('p', {
                text: 'No projects yet. Create your first project to get started.'
              })
            ]
          )
        : el(
            'div',
            { class: 'project-grid', 'data-testid': 'project-grid' },
            projects.map(project =>
              el(
                'div',
                {
                  class: 'project-card',
                  'data-testid': 'project-card',
                  'data-project-name': project.name,
                  onclick: () => renderProject(project.id)
                },
                [
                  el('h3', { text: project.name }),
                  el('p', { text: project.description || 'No description' }),
                  el('span', {
                    class: 'task-count',
                    text: `${project.tasks.length} task${project.tasks.length === 1 ? '' : 's'}`
                  })
                ]
              )
            )
          )
    ])
  );
}

async function renderProject(projectId) {
  const { project } = await api('GET', `/api/projects/${projectId}`);
  root.replaceChildren(
    renderTopbar(),
    el('main', { class: 'container', 'data-testid': 'project-page' }, [
      el('button', {
        class: 'breadcrumb',
        'data-testid': 'back-to-projects',
        text: '← Projects',
        onclick: renderDashboard
      }),
      el('div', { class: 'page-header' }, [
        el('h1', { 'data-testid': 'project-title', text: project.name })
      ]),
      el(
        'ul',
        { class: 'task-list', 'data-testid': 'task-list' },
        project.tasks.map(task =>
          el(
            'li',
            {
              class: `task-item${task.done ? ' done' : ''}`,
              'data-testid': 'task-item',
              'data-task-title': task.title
            },
            [
              el('input', {
                type: 'checkbox',
                'data-testid': 'task-checkbox',
                ...(task.done ? { checked: 'true' } : {}),
                onchange: async event => {
                  await api(
                    'PATCH',
                    `/api/projects/${projectId}/tasks/${task.id}`,
                    {
                      done: event.target.checked
                    }
                  );
                  await renderProject(projectId);
                }
              }),
              el('span', { class: 'task-title', text: task.title })
            ]
          )
        )
      ),
      el(
        'form',
        {
          class: 'task-form',
          'data-testid': 'task-form',
          onsubmit: async event => {
            event.preventDefault();
            const title = event.target.elements.title.value;
            await api('POST', `/api/projects/${projectId}/tasks`, { title });
            await renderProject(projectId);
          }
        },
        [
          el('input', {
            type: 'text',
            name: 'title',
            required: 'true',
            placeholder: 'Add a task…',
            'data-testid': 'task-title-input'
          }),
          el('button', {
            type: 'submit',
            class: 'btn-primary',
            'data-testid': 'task-submit-button',
            text: 'Add task'
          })
        ]
      )
    ])
  );
}

(async () => {
  try {
    const { email } = await api('GET', '/api/me');
    state.email = email;
    await renderDashboard();
  } catch {
    renderLogin();
  }
})();
