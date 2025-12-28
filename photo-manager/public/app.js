let allPhotos = [];
let filteredPhotos = [];

// 页面加载时获取照片和分类
document.addEventListener('DOMContentLoaded', () => {
    loadPhotos();
    loadCategories();
});

// 加载所有分类
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        populateCategorySelects(categories);
        renderCategoryList(categories);
        return categories;
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

// 填充所有分类下拉框
function populateCategorySelects(categories) {
    const selects = ['categoryFilter', 'uploadCategory', 'editCategory'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        const currentValue = select.value;

        // 保留第一个选项 (如果是过滤器)
        const firstOption = id === 'categoryFilter' ? '<option value="">所有分类</option>' : '';

        select.innerHTML = firstOption + categories.map(cat =>
            `<option value="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`
        ).join('');

        // 尝试恢复之前选中的值
        if (currentValue && categories.includes(currentValue)) {
            select.value = currentValue;
        }
    });
}

// 显示分类管理模态框
function showCategoryModal() {
    document.getElementById('categoryModal').style.display = 'flex';
    loadCategories();
}

// 关闭分类管理模态框
function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
}

// 渲染分类管理列表
function renderCategoryList(categories) {
    const list = document.getElementById('categoryList');
    list.innerHTML = categories.map(cat => `
        <li class="category-item">
            <span class="category-name">${cat}</span>
            <div class="category-item-actions">
                <button class="btn btn-secondary btn-small" onclick="renameCategory('${cat}')">重命名</button>
                <button class="btn btn-icon btn-small" onclick="deleteCategory('${cat}')" title="删除">🗑️</button>
            </div>
        </li>
    `).join('');
}

// 新增分类
async function addCategory() {
    const nameInput = document.getElementById('newCategoryName');
    const name = nameInput.value.trim();

    if (!name) {
        showError('请输入分类名称');
        return;
    }

    try {
        const response = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const result = await response.json();

        if (result.success) {
            showSuccess(`分类 "${name}" 创建成功`);
            nameInput.value = '';
            loadCategories();
        } else {
            showError('创建失败: ' + result.error);
        }
    } catch (error) {
        showError('创建失败: ' + error.message);
    }
}

// 重命名分类
async function renameCategory(oldName) {
    const newName = prompt(`将分类 "${oldName}" 重命名为:`, oldName);
    if (!newName || newName === oldName) return;

    try {
        const response = await fetch(`/api/categories/${oldName}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newName })
        });
        const result = await response.json();

        if (result.success) {
            showSuccess(`分类已重命名为 "${newName}"`);
            loadCategories();
            loadPhotos(); // 分类改变了，文件路径可能也变了，重新加载
        } else {
            showError('重命名失败: ' + result.error);
        }
    } catch (error) {
        showError('重命名失败: ' + error.message);
    }
}

// 删除分类
async function deleteCategory(name) {
    if (!confirm(`确定要删除分类 "${name}" 吗？\n只有空分类才能被删除。`)) return;

    try {
        const response = await fetch(`/api/categories/${name}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            showSuccess(`分类 "${name}" 已删除`);
            loadCategories();
        } else {
            showError('删除失败: ' + result.error);
        }
    } catch (error) {
        showError('删除失败: ' + error.message);
    }
}

// 加载所有照片
async function loadPhotos() {
    const grid = document.getElementById('photoGrid');
    grid.innerHTML = '<div class="loading">⌛ 正在加载照片...</div>';

    try {
        const response = await fetch('/api/photos');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        allPhotos = await response.json();

        if (!Array.isArray(allPhotos)) {
            console.error('Invalid data received:', allPhotos);
            allPhotos = [];
        }

        filteredPhotos = allPhotos;
        renderPhotos();
        updatePhotoCount();
    } catch (error) {
        console.error('Fetch error:', error);
        grid.innerHTML = `<div class="error-state">❌ 加载照片失败: ${error.message}</div>`;
        showError('加载照片失败: ' + error.message);
    }
}

// 渲染照片网格
function renderPhotos() {
    const grid = document.getElementById('photoGrid');

    if (!filteredPhotos) {
        grid.innerHTML = '<div class="error-state">⚠️ 数据加载错误</div>';
        return;
    }

    if (filteredPhotos.length === 0) {
        grid.innerHTML = '<div class="empty-state">📷 暂无照片<br><small>点击右上角"上传照片"开始添加</small></div>';
        return;
    }

    grid.innerHTML = filteredPhotos.map(photo => `
        <div class="photo-card" data-id="${photo.id}">
            <div class="photo-image" style="background-image: url('${photo.imagePath}')"></div>
            <div class="photo-info">
                <div class="photo-title">${photo.title || ''}</div>
                <div class="photo-meta">
                    <span class="category-badge">${photo.category}</span>
                    ${photo.tags ? photo.tags.slice(0, 3).map(tag =>
        `<span class="tag">${tag}</span>`
    ).join('') : ''}
                </div>
                <div class="photo-actions">
                    <button class="btn-icon" onclick="editPhoto('${photo.id}')" title="编辑">
                        ✏️
                    </button>
                    <button class="btn-icon" onclick="deletePhoto('${photo.id}')" title="删除">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// 过滤照片
function filterPhotos() {
    const category = document.getElementById('categoryFilter').value;
    const search = document.getElementById('searchInput').value.toLowerCase();

    filteredPhotos = allPhotos.filter(photo => {
        const matchCategory = !category || photo.category === category;
        const matchSearch = !search ||
            (photo.title && photo.title.toLowerCase().includes(search)) ||
            (photo.tags && photo.tags.some(tag => tag.toLowerCase().includes(search)));

        return matchCategory && matchSearch;
    });

    renderPhotos();
    updatePhotoCount();
}

// 更新照片计数
function updatePhotoCount() {
    document.getElementById('photoCount').textContent = filteredPhotos.length;
}

// 显示上传模态框
function showUploadModal() {
    document.getElementById('uploadModal').style.display = 'flex';
    document.getElementById('uploadForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
}

// 关闭上传模态框
function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
}

// 预览图片
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('imagePreview').innerHTML =
                `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
}

// 上传照片
async function uploadPhoto(event) {
    event.preventDefault();

    const formData = new FormData();
    // CRITICAL: Append text fields BEFORE the file so multer can access them in storage.destination
    formData.append('category', document.getElementById('uploadCategory').value);
    formData.append('title', document.getElementById('uploadTitle').value);
    formData.append('tags', document.getElementById('uploadTags').value);
    formData.append('content', document.getElementById('uploadContent').value);
    formData.append('image', document.getElementById('imageFile').files[0]);

    try {
        const response = await fetch('/api/photos', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showSuccess('照片上传成功！');
            closeUploadModal();
            loadPhotos();
        } else {
            showError('上传失败: ' + result.error);
        }
    } catch (error) {
        showError('上传失败: ' + error.message);
    }
}

// 编辑照片
function editPhoto(photoId) {
    const photo = allPhotos.find(p => p.id === photoId);
    if (!photo) return;

    document.getElementById('editPhotoId').value = photoId;
    document.getElementById('editCategory').value = photo.category;
    document.getElementById('editTitle').value = photo.title || '';
    document.getElementById('editTags').value = photo.tags ? photo.tags.join(', ') : '';
    document.getElementById('editWeight').value = photo.weight || 1;
    document.getElementById('editContent').value = photo.content || '';

    document.getElementById('editModal').style.display = 'flex';
}

// 关闭编辑模态框
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// 保存编辑
async function saveEdit(event) {
    event.preventDefault();

    const photoId = document.getElementById('editPhotoId').value;
    const [category, filename] = photoId.split('/');
    const newCategory = document.getElementById('editCategory').value;

    const data = {
        category: newCategory,
        title: document.getElementById('editTitle').value,
        tags: document.getElementById('editTags').value.split(',').map(t => t.trim()).filter(t => t),
        weight: parseInt(document.getElementById('editWeight').value),
        content: document.getElementById('editContent').value
    };

    try {
        const response = await fetch(`/api/photos/${category}/${filename}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            if (result.categoryChanged) {
                showSuccess('更新成功！照片已移动到新分类。');
            } else {
                showSuccess('更新成功！');
            }
            closeEditModal();
            loadPhotos();
        } else {
            showError('更新失败: ' + result.error);
        }
    } catch (error) {
        showError('更新失败: ' + error.message);
    }
}

// 删除照片
async function deletePhoto(photoId) {
    if (!confirm('确定要删除这张照片吗？')) return;

    const deleteImage = confirm('是否同时删除图片文件？\n（取消则只删除文章，保留图片文件）');
    const [category, filename] = photoId.split('/');

    try {
        const response = await fetch(`/api/photos/${category}/${filename}?deleteImage=${deleteImage}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showSuccess('删除成功！');
            loadPhotos();
        } else {
            showError('删除失败: ' + result.error);
        }
    } catch (error) {
        showError('删除失败: ' + error.message);
    }
}

// Git 操作
function showGitPanel() {
    document.getElementById('gitPanel').style.display = 'flex';
    checkGitStatus();
}

function closeGitPanel() {
    document.getElementById('gitPanel').style.display = 'none';
}

async function checkGitStatus() {
    const statusElement = document.getElementById('gitStatus');
    statusElement.textContent = '检查中...';

    try {
        const response = await fetch('/api/git/status', { method: 'POST' });
        const result = await response.json();

        statusElement.textContent = result.output;

        // 根据是否有更改显示不同样式
        if (result.hasChanges) {
            statusElement.style.color = '#f59e0b'; // 橙色
        } else {
            statusElement.style.color = '#10b981'; // 绿色
        }
    } catch (error) {
        statusElement.textContent = '❌ 错误: ' + error.message;
        statusElement.style.color = '#ef4444'; // 红色
    }
}

async function gitCommit() {
    const message = document.getElementById('commitMessage').value.trim();
    if (!message) {
        showError('请输入提交信息');
        return;
    }

    const outputElement = document.getElementById('commitOutput');
    outputElement.textContent = '提交中...';
    outputElement.style.color = '#10b981';

    try {
        const response = await fetch('/api/git/commit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const result = await response.json();
        outputElement.textContent = result.output;

        if (result.success) {
            showSuccess('提交成功！');
            outputElement.style.color = '#10b981';
            checkGitStatus(); // 刷新状态
        } else {
            outputElement.style.color = '#f59e0b';
        }
    } catch (error) {
        outputElement.textContent = '❌ 错误: ' + error.message;
        outputElement.style.color = '#ef4444';
        showError('提交失败');
    }
}

async function gitPush() {
    if (!confirm('确定要推送到 GitHub 吗？\n\n推送后 GitHub Actions 将自动部署网站。')) return;

    const outputElement = document.getElementById('pushOutput');
    outputElement.textContent = '推送中，请稍候...';
    outputElement.style.color = '#10b981';

    try {
        const response = await fetch('/api/git/push', { method: 'POST' });
        const result = await response.json();

        outputElement.textContent = result.output;

        if (result.success) {
            showSuccess('推送成功！');
            outputElement.style.color = '#10b981';
            checkGitStatus(); // 刷新状态
        } else {
            outputElement.style.color = '#f59e0b';
        }
    } catch (error) {
        outputElement.textContent = '❌ 错误: ' + error.message;
        outputElement.style.color = '#ef4444';
        showError('推送失败');
    }
}

// 通知函数
function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 关闭模态框（点击外部）
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}
