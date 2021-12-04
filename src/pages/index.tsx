import Head from 'next/head';
import { useState } from 'react';
import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';
import { prevPostFormatter } from '../utils/PrevPostFormatter';

import Header from '../components/Header';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

type Post = {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
};

type PostPagination = {
  next_page: string | null;
  results: Post[];
};

type HomeProps = {
  postsPagination: PostPagination;
};

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { next_page, results } = postsPagination;

  const [searchMoreAvailable, setSearchMoreAvailable] = useState(!!next_page);

  const [posts, setPosts] = useState<Post[]>(() => {
    return results.map(post => prevPostFormatter(post));
  });

  const router = useRouter();

  const fetchNextPage = async (): Promise<void> => {
    fetch(next_page)
      .then(res => res.json())
      .then(res => {
        const { next_page: currNextPage } = res.results;
        setSearchMoreAvailable(!!currNextPage);

        setPosts(
          posts.concat(res.results.map(post => prevPostFormatter(post)))
        );
      })
      .catch(err => {
        // eslint-disable-next-line
        console.error(err);
      });
  };

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>

      <main className={`${styles.container} ${commonStyles.wrapperWithTop}`}>
        <div className={styles.headerWrapper}>
          <Header />
        </div>
        <ul className={styles.listOfPosts}>
          {posts.map(({ uid, data, first_publication_date }) => (
            <li key={uid}>
              <button type="button" className={styles.PostPrevContainer}>
                {/* eslint-disable-next-line */}
                <h1
                  onClick={() =>
                    router.push(`/post/${uid}`, '', { shallow: true })
                  }
                >
                  {data.title}
                </h1>
                <p>{data.subtitle}</p>
                <div className={styles.PostPrevFooter}>
                  <div>
                    <FiCalendar />
                    <time>{first_publication_date}</time>
                  </div>
                  <div>
                    <FiUser />
                    <p>{data.author}</p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>

        {searchMoreAvailable && (
          <button className={styles.linkWrapper} type="button">
            {/* eslint-disable-next-line */}
            <span className={styles.link} onClick={fetchNextPage}>
              Carregar mais posts
            </span>
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.content'],
      pageSize: 2,
    }
  );

  const { next_page, results } = response;
  const postsPagination = { next_page, results };

  return {
    props: { postsPagination },
  };
};
