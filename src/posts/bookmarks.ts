'use strict';
//Switching 'require' to 'import' for compatibility
import db from '../database';
import plugins from '../plugins';

//Creating interfaces for complex types
interface PostData{
	pid: number;
	uid: number;
	bookmarks?: number;
}

interface BookmarkStatus {
	post: PostData;
	isBookmarked: boolean;
}

export default class Posts {
	//bookmark and unbookmark are public methods. Not sure what the types of pid and uid should be.
	// the return value is the same type as the return value of toggleBookmark
	public static async bookmark(pid: any, uid: any): Promise<BookmarkStatus  | null> {
		return await this.toggleBookmark('bookmark', pid, uid);
	};

	public static async unbookmark(pid: any, uid: any): Promise<BookmarkStatus  | null> {
		return await this.toggleBookmark('unbookmark', pid, uid);
	};

	//toggleBookmark is a private method. In this case whenever the method is called, the type is a string.
	private static async toggleBookmark(type: string, pid: any, uid: any): Promise<BookmarkStatus  | null> {
		if (uid as number <= 0) { // uid needs to be casted to a number
			throw new Error('[[error:not-logged-in]]');
		}

		const isBookmarking = type === 'bookmark';

		// The next line calls a function in a module that has not been updated to TS (getPostFields - src/posts/data.js). 
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const postData: PostData = await Posts.getPostFields(pid, ['pid', 'uid']);
		const hasBookmarked: boolean = await Posts.hasBookmarked(pid, uid);
		// I avoid using promise.all here because it wouldn't allow me to add types to postData and hasBookmarked		

		if (isBookmarking && hasBookmarked) {
			throw new Error('[[error:already-bookmarked]]');
		}

		if (!isBookmarking && !hasBookmarked) {
			throw new Error('[[error:already-unbookmarked]]');
		}

		if (isBookmarking) {
			await db.sortedSetAdd(`uid:${uid}:bookmarks`, Date.now(), pid);
		} else {
			await db.sortedSetRemove(`uid:${uid}:bookmarks`, pid);
		}
		await db[isBookmarking ? 'setAdd' : 'setRemove'](`pid:${pid}:users_bookmarked`, uid);
		postData.bookmarks = await db.setCount(`pid:${pid}:users_bookmarked`);
		
		// The next line calls a function in a module that has not been updated to TS (setPostField - src/posts/data.js). 
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		await Posts.setPostField(pid, 'bookmarks', postData.bookmarks);

		plugins.hooks.fire(`action:post.${type}`, {
			pid: pid,
			uid: uid,
			owner: postData.uid,
			current: hasBookmarked ? 'bookmarked' : 'unbookmarked',
		});

		return {
			post: postData,
			isBookmarked: isBookmarking,
		};
	}

	public static async hasBookmarked(pid: any, uid: any): Promise<any> {
		if (uid as number <= 0) {
			return Array.isArray(pid) ? pid.map(() => false) : false;
		}

		if (Array.isArray(pid)) {
			const sets = pid.map(pid => `pid:${pid}:users_bookmarked`);
			return await db.isMemberOfSets(sets, uid);
		}
		return await db.isSetMember(`pid:${pid}:users_bookmarked`, uid);
	};
};